import type { PermissionManager as IPermissionManager, PermissionRequest, HighRiskPermissionRequest } from '../tools/types.js';
import type { Reporter } from '../ui/reporter.js';
import { promptConfirm, promptHighRisk } from '../ui/prompts.js';
import { type SessionConfig, defaultSessionConfig } from './session-config.js';
import { requiresAlwaysConfirmRule } from './rules.js';

export class PermissionManager implements IPermissionManager {
    private config: SessionConfig;

    constructor(private reporter: Reporter, initialConfig?: SessionConfig) {
        this.config = initialConfig ?? { ...defaultSessionConfig };
    }

    setMode(mode: SessionConfig['mode']) {
        this.config.mode = mode;
    }

    async request(req: PermissionRequest): Promise<boolean> {
        const isAlwaysReq = requiresAlwaysConfirmRule(req.action || req.tool, req.path);

        // Se a regra diz que SEMPRE tem que confirmar, ignoramos o modo auto
        if (isAlwaysReq || this.config.mode === 'ask-all') {
            const promptMsg = req.preview
                ? `${req.preview}\nCriar/modificar este arquivo?`
                : `Deseja permitir que a ferramenta '${req.tool}' realize esta ação?`;

            const result = await promptConfirm(promptMsg, true);
            if (!result) {
                this.reporter.warning(`Ação de ${req.tool} negada pelo usuário`);
            }
            return result;
        }

        // Se mode = auto ou (ask-destructive + mas não há flag dizendo q é destructive): Pass.
        // Logically in the phase 1 simplifications, write_file passes if mode=ask-destructive because it's reversible.
        // However, if we delete a file, isAlwaysReq triggered above and blockeia isso.
        return true;
    }

    async requestHighRisk(req: HighRiskPermissionRequest): Promise<boolean> {
        this.reporter.warning(`ALTO RISCO DETECTADO:\n${req.action}`, req.potentialImpact);

        // High risk ignora qualquer --auto e obriga confirmação forte!
        return await promptHighRisk(`Ação: ${req.command}`, 'EXECUTAR');
    }
}

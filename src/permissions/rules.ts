import { isSensitivePath } from '../security/path-validator.js';

export interface PermissionRule {
    action: string | RegExp;
    requiresAlways: boolean;
    type?: 'destructive' | 'sensitive' | 'network' | 'system';
}

const ALWAYS_CONFIRM_RULES: PermissionRule[] = [
    // Ações de sistema
    { action: /^run_command:/, requiresAlways: true }, // Avaliação profunda será feital no command-validator
    // Ações irreversíveis
    { action: 'delete_file', requiresAlways: true, type: 'destructive' },
    { action: 'rm', requiresAlways: true, type: 'destructive' },
    // Comandos de SO que exigem privilégio ou são críticos
    { action: 'sudo', requiresAlways: true, type: 'system' },
];

export function requiresAlwaysConfirmRule(actionName: string, configToolContext?: string): boolean {
    // Se estiver tentando acesssar um caminho sensível bloqueamos a "auto mode" por padrão
    if (configToolContext && isSensitivePath(configToolContext)) {
        return true;
    }

    for (const rule of ALWAYS_CONFIRM_RULES) {
        if (typeof rule.action === 'string') {
            if (rule.action === actionName && rule.requiresAlways) return true;
        } else {
            if (rule.action.test(actionName) && rule.requiresAlways) return true;
        }
    }

    return false;
}

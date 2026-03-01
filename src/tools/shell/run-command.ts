import type { Tool, ToolResult, ToolContext } from '../types.js';
import { execa } from 'execa';
import { validateCommand } from '../../security/command-validator.js';
import { ToolExecutionError } from '../../errors.js';

export interface RunCommandInput {
    command: string;
}

export const runCommandTool: Tool<RunCommandInput, { stdout: string; stderr: string; exitCode: number }> = {
    name: 'run_command',
    description: 'Executa um comando shell arbitrário no diretório raiz do projeto. O LLM deve detalhar porque precisa do comando.',
    requiresConfirmation: true, // Sempre requer confirmação a menos que validado como puramente seguro
    isDestructive: false,

    inputSchema: {
        type: 'object',
        properties: {
            command: { type: 'string', description: 'O comando completo a ser executado' },
        },
        required: ['command'],
    },

    async execute(input: RunCommandInput, ctx: ToolContext): Promise<ToolResult<{ stdout: string; stderr: string; exitCode: number }>> {
        try {
            const validation = validateCommand(input.command);

            if (!validation.allowed) {
                return {
                    success: false,
                    error: `Comando bloqueado por motivos de segurança: ${validation.reason}`,
                    summary: `Execução de '${input.command}' bloqueada (risco de segurança)`,
                };
            }

            ctx.reporter.info(`Avaliando permissão para comando: ${input.command}`);
            let allowed = false;

            if (validation.severity === 'high' || validation.requiresExtraConfirmation) {
                allowed = await ctx.permissionManager.requestHighRisk({
                    action: `Executar comando com impacto de alto risco [RISCO: ${validation.severity}]`,
                    command: input.command,
                    potentialImpact: 'Pode modificar ambiente externo, realizar comunicação na rede ou ter impactos irreversíveis.',
                });
            } else {
                allowed = await ctx.permissionManager.request({
                    tool: 'run_command',
                    command: input.command,
                });
            }

            if (!allowed) {
                return {
                    success: false,
                    error: 'Comando cancelado pelo usuário.',
                    summary: `Execução de '${input.command}' cancelada pelo usuário.`,
                };
            }

            ctx.reporter.info(`Executando: ${input.command}`);

            // Usando execa param shell para permitir pipes simples se passarem na validação
            const proc = await execa({
                shell: true,
                cwd: ctx.projectRoot,
                timeout: 120_000,           // 2 min max
                cancelSignal: ctx.signal,   // Permite abortar externamente
                all: true,                  // Junta stdout/stderr se precisar
                reject: false,              // Retorna a promise mesmo se der erro (para ler o stdout)
                env: {
                    ...process.env,
                    // Remover variáveis sensíveis do LLM por precaução
                    ANTHROPIC_API_KEY: undefined,
                },
            })`${input.command}`;

            const result: ToolResult<{ stdout: string; stderr: string; exitCode: number }> = {
                success: proc.exitCode === 0,
                value: {
                    stdout: proc.stdout,
                    stderr: proc.stderr,
                    exitCode: proc.exitCode ?? -1,
                },
                summary: `Executou ${input.command} com código ${proc.exitCode}`,
            };

            if (proc.exitCode !== 0) {
                result.error = `Comando falhou com código ${proc.exitCode}`;
            }

            return result;

        } catch (e) {
            if ((e as any).name === 'AbortError') {
                return {
                    success: false,
                    error: 'O comando foi abortado (timeout ou cancelamento externo).',
                    summary: `Execução de '${input.command}' abortada.`,
                }
            }
            const msg = e instanceof Error ? e.message : String(e);
            throw new ToolExecutionError(this.name, `Erro crítico ao lançar processo: ${msg}`, [input.command], e);
        }
    },
};

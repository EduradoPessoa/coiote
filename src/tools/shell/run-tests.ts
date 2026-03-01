import type { Tool, ToolResult, ToolContext } from '../types.js';
import { execa } from 'execa';
import { ToolExecutionError } from '../../errors.js';

export interface RunTestsInput {
    pattern?: string;
}

export const runTestsTool: Tool<RunTestsInput, string> = {
    name: 'run_tests',
    description: 'Executa a suíte de testes do projeto.',
    requiresConfirmation: true,
    isDestructive: false,

    inputSchema: {
        type: 'object',
        properties: {
            pattern: { type: 'string', description: 'Opcional: filtro de arquivos de teste' },
        },
    },

    async execute(input: RunTestsInput, ctx: ToolContext): Promise<ToolResult<string>> {
        try {
            // Busca comando no config ou usa default
            // Como nao temos acesso ao config carregado direto aqui sem passar pelo ctx,
            // no futuro podemos injetar o config no ToolContext.
            // Por enquanto, vamos tentar descobrir o comando comum.

            const cmd = 'npm';
            const args = ['test'];
            if (input.pattern) args.push(input.pattern);

            ctx.reporter.toolCall('run_tests', { command: `${cmd} ${args.join(' ')}` });

            const allowed = await ctx.permissionManager.request({
                tool: 'run_tests',
                command: `${cmd} ${args.join(' ')}`
            });

            if (!allowed) {
                return {
                    success: false,
                    summary: 'Execução de testes recusada pelo usuário',
                    error: 'Permissão negada'
                };
            }

            const { stdout, stderr, failed } = await execa(cmd, args, {
                cwd: ctx.projectRoot,
                reject: false
            });

            const success = !failed;

            return {
                success,
                value: stdout + '\n' + stderr,
                summary: success ? 'Testes executados com sucesso' : 'Falha na execução dos testes'
            };

        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            throw new ToolExecutionError(this.name, `Erro ao rodar testes: ${msg}`, [], e);
        }
    }
};

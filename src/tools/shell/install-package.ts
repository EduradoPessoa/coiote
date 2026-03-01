import type { Tool, ToolResult, ToolContext } from '../types.js';
import { execa } from 'execa';
import { ToolExecutionError } from '../../errors.js';

export interface InstallPackageInput {
    name: string;
    dev?: boolean;
    manager?: 'npm' | 'pnpm' | 'yarn';
}

export const installPackageTool: Tool<InstallPackageInput, string> = {
    name: 'install_package',
    description: 'Instala uma nova dependência no projeto.',
    requiresConfirmation: true,
    isDestructive: false,

    inputSchema: {
        type: 'object',
        properties: {
            name: { type: 'string', description: 'Nome do pacote a instalar' },
            dev: { type: 'boolean', description: 'Instalar como devDependency' },
            manager: { type: 'string', enum: ['npm', 'pnpm', 'yarn'], description: 'Gerenciador de pacotes' }
        },
        required: ['name'],
    },

    async execute(input: InstallPackageInput, ctx: ToolContext): Promise<ToolResult<string>> {
        try {
            const manager = input.manager || 'pnpm';
            const args = [manager === 'npm' ? 'install' : 'add', input.name];
            if (input.dev) args.push('-D');

            const fullCmd = `${manager} ${args.join(' ')}`;

            ctx.reporter.toolCall('install_package', { command: fullCmd });

            const allowed = await ctx.permissionManager.request({
                tool: 'install_package',
                command: fullCmd
            });

            if (!allowed) {
                return {
                    success: false,
                    summary: 'Instalação recusada pelo usuário',
                    error: 'Permissão negada'
                };
            }

            const { stdout, stderr, failed } = await execa(manager, args, {
                cwd: ctx.projectRoot,
                reject: false
            });

            const success = !failed;

            return {
                success,
                value: stdout + '\n' + stderr,
                summary: success ? `Pacote ${input.name} instalado` : `Falha ao instalar ${input.name}`
            };

        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            throw new ToolExecutionError(this.name, `Erro ao instalar pacote: ${msg}`, [input.name], e);
        }
    }
};

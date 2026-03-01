import type { Tool, ToolResult, ToolContext } from '../types.js';
import { simpleGit } from 'simple-git';
import { ToolExecutionError } from '../../errors.js';

export interface GitCommitInput {
    message: string;
    addFiles?: string[];
    addAll?: boolean;
}

export const gitCommitTool: Tool<GitCommitInput, string> = {
    name: 'git_commit',
    description: 'Realiza add e commit em arquivos no repositório.',
    requiresConfirmation: true, // Ação que propõe o commit interativo via reporter e tools UI guard
    isDestructive: false,

    inputSchema: {
        type: 'object',
        properties: {
            message: { type: 'string', description: 'Mensagem formatada pelo padrão Conventional Commits (ex: feat: xxx)' },
            addFiles: { type: 'array', items: { type: 'string' }, description: 'Lista de arquivos isolada para stage e commmit. Alternativa ao addAll' },
            addAll: { type: 'boolean', description: 'Se TRUE, equivalent à `git commit -am`' }
        },
        required: ['message']
    },

    async execute(input: GitCommitInput, ctx: ToolContext): Promise<ToolResult<string>> {
        try {
            const git = simpleGit(ctx.projectRoot);

            if (!await git.checkIsRepo()) {
                return {
                    success: false,
                    summary: 'Este contexto não é versionado via git',
                    error: 'Not a git repository.'
                };
            }

            ctx.reporter.toolCall('git_commit', { message: input.message });

            const allowed = await ctx.permissionManager.request({
                tool: 'git_commit',
                command: input.addAll ? `git add . && git commit -m "${input.message}"` : `git commit -m "${input.message}"`
            });

            if (!allowed) {
                return {
                    success: false,
                    summary: 'Commit de git recusado',
                    error: 'Atividade negada'
                };
            }

            if (input.addAll) {
                await git.add('.');
            } else if (input.addFiles && input.addFiles.length > 0) {
                await git.add(input.addFiles);
            }

            const res = await git.commit(input.message);

            return {
                success: true,
                value: res.commit,
                summary: `Commit gerado: ${res.commit} (${input.message})`
            };

        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            throw new ToolExecutionError(this.name, `Erro ao gerar commit: ${msg}`, [], e);
        }
    }
};

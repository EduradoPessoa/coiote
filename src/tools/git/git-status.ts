import type { Tool, ToolResult, ToolContext } from '../types.js';
import { simpleGit } from 'simple-git';
import { ToolExecutionError } from '../../errors.js';

export interface GitStatusInput { }

export const gitStatusTool: Tool<GitStatusInput, string> = {
    name: 'git_status',
    description: 'Retorna o status atual do git no diretório raiz do projeto (arquivos modificados, branch, untracked).',
    requiresConfirmation: false,
    isDestructive: false,

    inputSchema: {
        type: 'object',
        properties: {}
    },

    async execute(_input: GitStatusInput, ctx: ToolContext): Promise<ToolResult<string>> {
        try {
            const git = simpleGit(ctx.projectRoot);

            if (!await git.checkIsRepo()) {
                return {
                    success: false,
                    summary: 'Este não é um repositório git válido.',
                    error: 'Not a git repository.'
                };
            }

            const status = await git.status();

            const summary = [
                `Branch: ${status.current}`,
                `Modificados: ${status.modified.length}`,
                `Adicionados: ${status.created.length}`,
                `Untracked: ${status.not_added.length}`
            ].join(' | ');

            return {
                success: true,
                value: JSON.stringify(status, null, 2),
                summary: `Status lido (${summary})`
            };

        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            throw new ToolExecutionError(this.name, `Erro ao rodar git status: ${msg}`, [], e);
        }
    }
};

import type { Tool, ToolResult, ToolContext } from '../types.js';
import { simpleGit } from 'simple-git';
import { ToolExecutionError } from '../../errors.js';

export interface GitDiffInput {
    file?: string;
    staged?: boolean;
}

export const gitDiffTool: Tool<GitDiffInput, string> = {
    name: 'git_diff',
    description: 'Retorna a string formatada em patch do git diff de um arquivo específico ou com alterações staged.',
    requiresConfirmation: false,
    isDestructive: false,

    inputSchema: {
        type: 'object',
        properties: {
            file: { type: 'string', description: 'O caminho do arquivo a gerar Diff, caso vazio retorna toda alteração pending' },
            staged: { type: 'boolean', description: 'Defina para verdadeiro (true) caso deseje examinar o index (--cached)' }
        }
    },

    async execute(input: GitDiffInput, ctx: ToolContext): Promise<ToolResult<string>> {
        try {
            const git = simpleGit(ctx.projectRoot);

            if (!await git.checkIsRepo()) {
                return {
                    success: false,
                    summary: 'Este não é um repositório git válido.',
                    error: 'Not a git repository.'
                };
            }

            const options: string[] = [];
            if (input.staged) options.push('--cached');
            if (input.file) {
                options.push('--');
                options.push(input.file);
            }

            const diff = await git.diff(options);

            return {
                success: true,
                value: diff,
                summary: diff.length > 0 ? `Diff retornado de ${diff.split('\\n').length} linhas` : 'Nenhuma alteração a retornar via Diffs.'
            };

        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            throw new ToolExecutionError(this.name, `Erro ao rodar git diff: ${msg}`, [], e);
        }
    }
};

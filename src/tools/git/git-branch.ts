import type { Tool, ToolResult, ToolContext } from '../types.js';
import { simpleGit } from 'simple-git';
import { ToolExecutionError } from '../../errors.js';

export interface GitBranchInput {
    branch: string;
    create?: boolean;
}

export const gitBranchTool: Tool<GitBranchInput, string> = {
    name: 'git_branch',
    description: 'Alterna ou cria branches no repositório.',
    requiresConfirmation: false,
    isDestructive: false,

    inputSchema: {
        type: 'object',
        properties: {
            branch: { type: 'string', description: 'Nome do branch a ir ou criar' },
            create: { type: 'boolean', description: 'Se TRUE, faz o checkout originando branch novo' }
        },
        required: ['branch']
    },

    async execute(input: GitBranchInput, ctx: ToolContext): Promise<ToolResult<string>> {
        try {
            const git = simpleGit(ctx.projectRoot);

            if (!await git.checkIsRepo()) {
                return {
                    success: false,
                    summary: 'Fora de repositório.',
                    error: 'Not repo'
                };
            }

            if (input.create) {
                await git.checkoutLocalBranch(input.branch);
                return {
                    success: true,
                    summary: `Branch criado e focado: ${input.branch}`
                };
            }

            await git.checkout(input.branch);
            return {
                success: true,
                summary: `Branch em uso: ${input.branch}`
            };

        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            throw new ToolExecutionError(this.name, `Impossivel trocar git branch: ${msg}`, [], e);
        }
    }
};

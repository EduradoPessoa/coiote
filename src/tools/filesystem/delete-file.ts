import type { Tool, ToolResult, ToolContext } from '../types.js';
import fs from 'fs-extra';
import { validatePath } from '../../security/path-validator.js';
import { ToolExecutionError } from '../../errors.js';

export interface DeleteFileInput {
    path: string;
}

export const deleteFileTool: Tool<DeleteFileInput, string> = {
    name: 'delete_file',
    description: 'Deleta um arquivo permanentemente do projeto.',
    requiresConfirmation: true,
    isDestructive: true,

    inputSchema: {
        type: 'object',
        properties: {
            path: { type: 'string', description: 'Caminho relativo do arquivo' },
        },
        required: ['path'],
    },

    async execute(input: DeleteFileInput, ctx: ToolContext): Promise<ToolResult<string>> {
        try {
            const validated = validatePath(input.path, ctx.projectRoot);
            const fullPath = validated.absolute;

            if (!await fs.pathExists(fullPath)) {
                return {
                    success: false,
                    error: `O arquivo '${input.path}' não existe.`,
                    summary: `Falha ao deletar ${input.path}: arquivo inexistente`
                };
            }

            // Pedir permissao de ALTO RISCO (conforme PRD e orchestrator)
            const allowed = await ctx.permissionManager.requestHighRisk({
                action: 'DELETAR ARQUIVO',
                path: input.path,
                potentialImpact: 'O arquivo será removido permanentemente do sistema de arquivos.'
            });

            if (!allowed) {
                return {
                    success: false,
                    summary: 'Deleção cancelada pelo usuário',
                    error: 'Permissão negada'
                };
            }

            await fs.remove(fullPath);

            return {
                success: true,
                value: `Arquivo deletado: ${input.path}`,
                summary: `Arquivo removido: ${input.path}`
            };

        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            throw new ToolExecutionError(this.name, `Erro ao deletar arquivo: ${msg}`, [input.path], e);
        }
    }
};

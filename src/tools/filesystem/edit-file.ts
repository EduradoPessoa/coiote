import type { Tool, ToolResult, ToolContext } from '../types.js';
import fs from 'fs-extra';
import { validatePath } from '../../security/path-validator.js';
import { ToolExecutionError } from '../../errors.js';

export interface EditFileInput {
    path: string;
    oldTextContent: string;
    newTextContent: string;
}

export const editFileTool: Tool<EditFileInput, string> = {
    name: 'edit_file',
    description: 'Edita uma parte específica de um arquivo. Localiza o texto antigo e substitui pelo novo.',
    requiresConfirmation: true,
    isDestructive: false,

    inputSchema: {
        type: 'object',
        properties: {
            path: { type: 'string', description: 'Caminho relativo do arquivo' },
            oldTextContent: { type: 'string', description: 'O texto exato a ser substituído (deve ser único no arquivo)' },
            newTextContent: { type: 'string', description: 'O novo texto que entrará no lugar' },
        },
        required: ['path', 'oldTextContent', 'newTextContent'],
    },

    async execute(input: EditFileInput, ctx: ToolContext): Promise<ToolResult<string>> {
        try {
            const validated = validatePath(input.path, ctx.projectRoot);
            const fullPath = validated.absolute;

            if (!await fs.pathExists(fullPath)) {
                return {
                    success: false,
                    error: `O arquivo '${input.path}' não existe.`,
                    summary: `Falha ao editar ${input.path}: arquivo inexistente`
                };
            }

            const content = await fs.readFile(fullPath, 'utf8');

            // Verificacao de ocorrencia unica
            const index = content.indexOf(input.oldTextContent);
            if (index === -1) {
                return {
                    success: false,
                    error: 'Texto de origem não encontrado no arquivo.',
                    summary: 'Falha na edição: texto original não localizado'
                };
            }

            const lastIndex = content.lastIndexOf(input.oldTextContent);
            if (index !== lastIndex) {
                return {
                    success: false,
                    error: 'Texto de origem encontrado múltiplas vezes. Seja mais específico.',
                    summary: 'Falha na edição: ambiguidade detectada'
                };
            }

            // Preview para o reporter
            ctx.reporter.toolCall('edit_file', {
                path: input.path,
                preview: `Substituindo bloco de ${input.oldTextContent.split('\n').length} linhas...`
            });

            // Pedir permissao
            const allowed = await ctx.permissionManager.request({
                tool: 'edit_file',
                path: input.path,
                action: 'modify'
            });

            if (!allowed) {
                return {
                    success: false,
                    summary: 'Edição recusada pelo usuário',
                    error: 'Permissão negada'
                };
            }

            const newContent = content.replace(input.oldTextContent, input.newTextContent);
            await fs.writeFile(fullPath, newContent, 'utf8');

            return {
                success: true,
                value: `Editado com sucesso: ${input.path}`,
                summary: `Arquivo editado: ${input.path} (${input.newTextContent.split('\n').length} novas linhas)`
            };

        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            throw new ToolExecutionError(this.name, `Erro ao editar arquivo: ${msg}`, [input.path], e);
        }
    }
};

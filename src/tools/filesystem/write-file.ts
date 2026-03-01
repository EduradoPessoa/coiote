import type { Tool, ToolResult, ToolContext } from '../types.js';
import fs from 'fs-extra';
import { validatePath } from '../../security/path-validator.js';
import { ToolExecutionError } from '../../errors.js';

export interface WriteFileInput {
    path: string;
    content: string;
    createDirectories?: boolean;
}

export const writeFileTool: Tool<WriteFileInput, void> = {
    name: 'write_file',
    description: 'Cria ou sobrescreve um arquivo com o conteúdo fornecido. Sempre exibe um preview/diff antes de escrever.',
    requiresConfirmation: true,
    isDestructive: false,

    inputSchema: {
        type: 'object',
        properties: {
            path: { type: 'string', description: 'Caminho relativo ao projeto' },
            content: { type: 'string', description: 'Conteúdo completo do arquivo (cuidado com escapamento em JSON)' },
            createDirectories: { type: 'boolean', description: 'Se true, cria as pastas intermediárias se não existirem', default: true },
        },
        required: ['path', 'content'],
    },

    async execute(input: WriteFileInput, ctx: ToolContext): Promise<ToolResult<void>> {
        let fullPath = '';
        try {
            const validated = validatePath(input.path, ctx.projectRoot);
            fullPath = validated.absolute;

            const isOverwrite = await fs.pathExists(fullPath);
            // Aqui num sistema maduro usaríamos um `generateDiff`
            const diffLabel = isOverwrite ? 'Sobrescrever arquivo existente' : 'Criar novo arquivo';

            ctx.reporter.toolCall('write_file', { path: input.path }, diffLabel);

            const allowed = await ctx.permissionManager.request({
                tool: 'write_file',
                path: input.path,
                preview: diffLabel, // Simplificação - no futuro geraremos diff de fato
                isOverwrite,
            });

            if (!allowed) {
                return {
                    success: false,
                    error: 'Operação cancelada pelo usuário.',
                    summary: `Escrita em ${input.path} cancelada`,
                };
            }

            if (input.createDirectories !== false) {
                await fs.outputFile(fullPath, input.content, 'utf-8');
            } else {
                await fs.writeFile(fullPath, input.content, 'utf-8');
            }

            return {
                success: true,
                summary: `Arquivo escrito: ${input.path}`,
            };

        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            throw new ToolExecutionError(this.name, `Erro ao escrever arquivo: ${msg}`, [input.path], e);
        }
    },
};

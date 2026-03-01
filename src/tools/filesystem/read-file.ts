import type { Tool, ToolResult, ToolContext } from '../types.js';
import fs from 'fs-extra';
import { validatePath } from '../../security/path-validator.js';
import { ToolExecutionError } from '../../errors.js';

export interface ReadFileInput {
    path: string;
}

export const readFileTool: Tool<ReadFileInput, string> = {
    name: 'read_file',
    description: 'Lê o conteúdo de um arquivo do projeto.',
    requiresConfirmation: false,
    isDestructive: false,

    inputSchema: {
        type: 'object',
        properties: {
            path: { type: 'string', description: 'Caminho relativo do arquivo' },
        },
        required: ['path'],
    },

    async execute(input: ReadFileInput, ctx: ToolContext): Promise<ToolResult<string>> {
        let fullPath = '';
        try {
            const validated = validatePath(input.path, ctx.projectRoot);
            fullPath = validated.absolute;

            const exists = await fs.pathExists(fullPath);
            if (!exists) {
                return {
                    success: false,
                    error: `O arquivo '${input.path}' não existe.`,
                    summary: `Falha ao ler ${input.path}: arquivo não encontrado`,
                };
            }

            const content = await fs.readFile(fullPath, 'utf-8');

            return {
                success: true,
                value: content,
                summary: `Arquivo lido: ${input.path}`,
            };
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            throw new ToolExecutionError(this.name, `Erro ao ler o arquivo: ${msg}`, [input.path], e);
        }
    },
};

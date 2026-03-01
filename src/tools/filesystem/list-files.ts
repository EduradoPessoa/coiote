import type { Tool, ToolResult, ToolContext } from '../types.js';
import { glob } from 'glob';
import { isSensitivePath } from '../../security/path-validator.js';
import { ToolExecutionError } from '../../errors.js';

export interface ListFilesInput {
    pattern: string;
    ignore?: string[];
}

export const listFilesTool: Tool<ListFilesInput, string[]> = {
    name: 'list_files',
    description: 'Lista arquivos usando padrões glob (ex: src/**/*.ts). Filtra automaticamente arquivos sensíveis e node_modules.',
    requiresConfirmation: false,
    isDestructive: false,

    inputSchema: {
        type: 'object',
        properties: {
            pattern: { type: 'string', description: 'Padrão glob para buscar' },
            ignore: { type: 'array', items: { type: 'string' }, description: 'Padrões adicionais para ignorar' },
        },
        required: ['pattern'],
    },

    async execute(input: ListFilesInput, ctx: ToolContext): Promise<ToolResult<string[]>> {
        try {
            const defaultIgnores = ['node_modules/**', 'dist/**', '.git/**'];
            const ignores = input.ignore ? [...defaultIgnores, ...input.ignore] : defaultIgnores;

            const files = await glob(input.pattern, {
                cwd: ctx.projectRoot,
                ignore: ignores,
                absolute: false,
                dot: true,
            });

            // Validar sensitivos - glob ignora dirs, mas é bom prevenir se o filename for sensível
            const safeFiles = files.filter((f) => !isSensitivePath(f));

            return {
                success: true,
                value: safeFiles,
                summary: `Listados ${safeFiles.length} arquivos correspondendo a: ${input.pattern}`,
            };
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            throw new ToolExecutionError(this.name, `Erro na listagem de arquivos: ${msg}`, [input.pattern], e);
        }
    },
};

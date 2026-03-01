import type { Tool, ToolResult, ToolContext } from '../types.js';
import fs from 'fs-extra';
import { validatePath } from '../../security/path-validator.js';
import { ToolExecutionError } from '../../errors.js';
import { scanForInjection } from '../../security/injection-detector.js';
import { sanitizeForLLM } from '../../security/content-sanitizer.js';

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

            // Security Scan
            const scan = scanForInjection(content, input.path);
            if (!scan.safe) {
                return {
                    success: false,
                    summary: `Leitura bloqueada em ${input.path}: suspeita de Prompt Injection`,
                    error: `Prompt Injection detectado: ${scan.findings.join(', ')}`
                };
            }

            // Sanitization
            const cleanContent = sanitizeForLLM(content);

            return {
                success: true,
                value: cleanContent,
                summary: `Arquivo lido: ${input.path}`,
            };
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            throw new ToolExecutionError(this.name, `Erro ao ler o arquivo: ${msg}`, [input.path], e);
        }
    },
};

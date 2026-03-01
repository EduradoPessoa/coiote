import type { Tool, ToolResult, ToolContext } from '../types.js';
import fs from 'fs-extra';
import path from 'path';
import { ToolExecutionError } from '../../errors.js';

export interface SearchFilesInput {
    query: string;
    includePatterns?: string[]; // ['*.ts', 'src/']
}

export const searchFilesTool: Tool<SearchFilesInput, string> = {
    name: 'search_files',
    description: 'Busca por um padrão de texto nos arquivos do projeto.',
    requiresConfirmation: false,
    isDestructive: false,

    inputSchema: {
        type: 'object',
        properties: {
            query: { type: 'string', description: 'O texto ou regex a buscar' },
            includePatterns: { type: 'array', items: { type: 'string' }, description: 'Opcional: Subpastas ou tipos de arquivos' },
        },
        required: ['query'],
    },

    async execute(input: SearchFilesInput, ctx: ToolContext): Promise<ToolResult<string>> {
        try {
            const results: { path: string; line: number; text: string }[] = [];
            const root = ctx.projectRoot;

            // Busca recursiva simples (Fallback quando rg nao existe)
            const walk = async (dir: string) => {
                const files = await fs.readdir(dir);
                for (const file of files) {
                    const fullPath = path.join(dir, file);
                    const relPath = path.relative(root, fullPath);

                    // Ignore patterns basicos
                    if (file === 'node_modules' || file === '.git' || file === 'dist') continue;

                    const stat = await fs.stat(fullPath);
                    if (stat.isDirectory()) {
                        await walk(fullPath);
                    } else if (stat.isFile()) {
                        // Filtro de extensao (opcional)
                        if (input.includePatterns && input.includePatterns.length > 0) {
                            // Implementacao simplificada de match
                            const match = input.includePatterns.some(p => relPath.includes(p.replace(/\*/g, '')));
                            if (!match) continue;
                        }

                        const content = await fs.readFile(fullPath, 'utf8');
                        const lines = content.split('\n');
                        lines.forEach((lineText, idx) => {
                            if (lineText.includes(input.query)) {
                                results.push({
                                    path: relPath,
                                    line: idx + 1,
                                    text: lineText.trim()
                                });
                            }
                        });
                    }

                    if (results.length > 100) break; // Limite de seguranca
                }
            };

            await walk(root);

            if (results.length === 0) {
                return {
                    success: true,
                    value: 'Nenhum resultado encontrado.',
                    summary: `Busca por "${input.query}": 0 resultados`
                };
            }

            const formatted = results.map(r => `${r.path}:${r.line}: ${r.text}`).join('\n');

            return {
                success: true,
                value: formatted,
                summary: `Busca por "${input.query}": ${results.length} resultados encontrados`
            };

        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            throw new ToolExecutionError(this.name, `Erro na busca: ${msg}`, [], e);
        }
    }
};

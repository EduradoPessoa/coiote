import fs from 'fs-extra';
import path from 'path';
import { sanitizeForLLM } from '../security/content-sanitizer.js';
import { scanForInjection } from '../security/injection-detector.js';

export interface ContextFile {
    path: string;
    content: string;
    isTruncated: boolean;
    isSensitive?: boolean;
}

export class ContextManager {
    private maxLines = 200;

    constructor(private projectRoot: string) { }

    /**
     * Carrega um arquivo para o contexto com sanitização e trucamento
     */
    async loadFile(relativePath: string): Promise<ContextFile> {
        const absolutePath = path.resolve(this.projectRoot, relativePath);
        let content = await fs.readFile(absolutePath, 'utf8');

        // Scan de Injeção
        const scan = scanForInjection(content, relativePath);
        if (!scan.safe) {
            return {
                path: relativePath,
                content: `[BLOQUEADO: Prompt Injection Detectado]\n${scan.findings.join('\n')}`,
                isTruncated: false,
                isSensitive: true
            };
        }

        // Sanitização
        content = sanitizeForLLM(content);

        // Truncamento inteligente
        const lines = content.split('\n');
        let finalContent = content;
        let isTruncated = false;

        if (lines.length > this.maxLines) {
            isTruncated = true;
            const head = lines.slice(0, 50).join('\n');
            const tail = lines.slice(-50).join('\n');
            const summary = this.summarizeCode(content, relativePath);
            finalContent = `${head}\n\n... [Arquivo grande (${lines.length} linhas). Meio omitido] ...\n\n${summary}\n\n... [Fim do resumo de estrutura] ...\n\n${tail}`;
        }

        return {
            path: relativePath,
            content: finalContent,
            isTruncated
        };
    }

    private summarizeCode(content: string, filePath: string): string {
        const ext = path.extname(filePath).toLowerCase();
        const relevantExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.go'];
        if (!relevantExtensions.includes(ext)) return '';

        const lines = content.split('\n');
        const symbols: string[] = [];

        // Regex rapidas para simbolos de estrutura
        const patterns = [
            /^(export\s+)?(class|interface|enum|type)\s+([a-zA-Z0-9_]+)/,
            /^(export\s+)?(async\s+)?function\s+([a-zA-Z0-9_]+)/,
            /^(export\s+)?const\s+([a-zA-Z0-9_]+)\s*=\s*/,
        ];

        for (const line of lines) {
            if (patterns.some(p => p.test(line.trim()))) {
                symbols.push(line.trim());
            }
        }

        if (symbols.length === 0) return '';
        return `[RESUMO DE ESTRUTURA]\n${symbols.slice(0, 30).join('\n')}${symbols.length > 30 ? '\n...' : ''}`;
    }

    /**
   * Coleta o contexto inicial baseado em configuracoes do projeto e na tarefa
   */
    async collectInitialContext(alwaysInclude: string[]): Promise<ContextFile[]> {
        const results: ContextFile[] = [];

        // 1. Arquivos de inclusao obrigatoria
        for (const filePattern of alwaysInclude) {
            // Simples check de arquivo por enquanto, no futuro suportar globs
            try {
                if (await fs.pathExists(path.resolve(this.projectRoot, filePattern))) {
                    const stats = await fs.stat(path.resolve(this.projectRoot, filePattern));
                    if (stats.isFile()) {
                        results.push(await this.loadFile(filePattern));
                    }
                }
            } catch (e) {
                // Ignora erros de leitura no contexto inicial (arquivos nao encontrados etc)
            }
        }

        return results;
    }

    /**
     * Formata os arquivos para inclusão no System Prompt ou Mensagem
     */
    formatContext(files: ContextFile[]): string {
        if (files.length === 0) return '';

        return files.map(f => {
            return `<file_content path="${f.path}" truncated="${f.isTruncated}">\n${f.content}\n</file_content>`;
        }).join('\n\n');
    }
}

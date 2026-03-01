import fs from 'fs-extra';
import path from 'path';

export interface ProjectConfig {
    context: string;
    commands: {
        test?: string;
        build?: string;
        lint?: string;
        dev?: string;
        custom: Record<string, string>;
    };
    conventions: string[];
    permissions: {
        autoApprove: string[];
        alwaysConfirm: string[];
        neverDo: string[];
        protectedPaths: string[];
        sensitiveFiles: string[];
    };
    alwaysInclude: string[];
    ignore: string[];
}

const DEFAULT_CONFIG: ProjectConfig = {
    context: '',
    commands: { custom: {} },
    conventions: [],
    permissions: {
        autoApprove: [],
        alwaysConfirm: [],
        neverDo: [],
        protectedPaths: ['.git/', 'node_modules/', 'dist/'],
        sensitiveFiles: ['.env', '.env.*', '*.pem', '*.key', 'secrets/']
    },
    alwaysInclude: [],
    ignore: []
};

function extractList(text: string): string[] {
    return text.split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('-') || line.startsWith('*'))
        .map(line => line.substring(1).trim());
}

function extractSection(content: string, heading: string): string {
    const regex = new RegExp(`##?\\s+${heading}\\s*\\n([\\s\\S]*?)(?=\\n##?\\s+|$)`, 'i');
    const match = regex.exec(content);
    return match && match[1] ? match[1].trim() : '';
}

export class ProjectConfigManager {
    static async load(projectRoot: string): Promise<ProjectConfig> {
        const configPath = path.join(projectRoot, 'coiote.config.md');

        if (!await fs.pathExists(configPath)) {
            return { ...DEFAULT_CONFIG };
        }

        try {
            const content = await fs.readFile(configPath, 'utf8');
            const config: ProjectConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

            config.context = extractSection(content, 'Contexto do Projeto');

            const comandosStr = extractSection(content, 'Comandos');
            if (comandosStr) {
                config.commands.custom = config.commands.custom || {};
                const cmdLines = extractList(comandosStr);
                for (const line of cmdLines) {
                    const match = line.match(/^([^:]+):\s*`([^`]+)`/);
                    if (match && match[1] && match[2]) {
                        const name = match[1];
                        const cmd = match[2];
                        const n = name.trim().toLowerCase();
                        if (n === 'testes' || n === 'test') config.commands.test = cmd;
                        else if (n === 'build') config.commands.build = cmd;
                        else if (n === 'lint') config.commands.lint = cmd;
                        else if (n === 'dev' || n === 'development') config.commands.dev = cmd;
                        else if (config.commands.custom) config.commands.custom[name.trim()] = cmd;
                    }
                }
            }

            const convencoesStr = extractSection(content, 'Convenções');
            if (convencoesStr) {
                const parsed = extractList(convencoesStr);
                if (parsed.length) config.conventions = parsed;
            }

            const permissoesStr = extractSection(content, 'Permissões');
            if (permissoesStr) {
                const autoApproveStr = extractSection(permissoesStr, 'Aprovação automática');
                if (autoApproveStr) config.permissions.autoApprove = extractList(autoApproveStr);

                const alwaysConfirmStr = extractSection(permissoesStr, 'Sempre confirmar');
                if (alwaysConfirmStr) config.permissions.alwaysConfirm = extractList(alwaysConfirmStr);

                const neverDoStr = extractSection(permissoesStr, 'Nunca fazer');
                if (neverDoStr) config.permissions.neverDo = extractList(neverDoStr);

                const sensitiveStr = extractSection(permissoesStr, 'Arquivos sensíveis.*');
                if (sensitiveStr) {
                    const items = extractList(sensitiveStr);
                    if (items.length) config.permissions.sensitiveFiles.push(...items);
                }
            }

            const arquivoSensiveisStr = extractSection(content, 'Arquivos sensíveis.*');
            if (arquivoSensiveisStr) {
                const items = extractList(arquivoSensiveisStr);
                if (items.length) {
                    config.permissions.sensitiveFiles = [...new Set([...config.permissions.sensitiveFiles, ...items])];
                }
            }

            const contextFilesStr = extractSection(content, 'Contexto de Arquivos.*');
            if (contextFilesStr) {
                // Tenta pegar códigos
                const matches = contextFilesStr.match(/`([^`]+)`/g) || [];
                if (matches.length) {
                    config.alwaysInclude = matches.map(m => m.replace(/`/g, ''));
                } else {
                    // Ou tenta ler linhas normais que pareçam caminhos
                    const lines = contextFilesStr.split('\n');
                    for (const line of lines) {
                        const trimmed = line.trim();
                        // Simples hack para o parse das caixas de código
                        if (trimmed.length > 0 && !trimmed.startsWith('```') && !trimmed.startsWith('Ao iniciar') && !trimmed.startsWith('Arquivos')) {
                            config.alwaysInclude.push(trimmed);
                        }
                    }
                }
            }

            return config;
        } catch (e) {
            // Retorna default se tiver erro no parse
            return { ...DEFAULT_CONFIG };
        }
    }
}

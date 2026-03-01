/**
 * 🐺 Coiote CLI — Configuração de comandos com Commander
 *
 * Parse de argumentos, help, version e routing de comandos.
 */

import { createRequire } from 'module';
import { Command } from 'commander';
import { GlobalConfig } from './config/global-config.js';
import { KeyManager } from './config/key-manager.js';
import { initializeProject } from './config/init-project.js';
import { CoioteAgent } from './agent/agent.js';
import { Reporter } from './ui/reporter.js';
import { PermissionManager } from './permissions/permission-manager.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { ToolRegistry } from './tools/registry.js';
import { readFileTool, writeFileTool, listFilesTool } from './tools/filesystem/index.js';
import { runCommandTool } from './tools/shell/index.js';
import { gitStatusTool, gitDiffTool, gitCommitTool, gitBranchTool } from './tools/git/index.js';
import { ProjectConfigManager } from './config/project-config.js';

interface PackageJson {
    version: string;
    description: string;
}

function loadPackageJson(): PackageJson {
    const require = createRequire(import.meta.url);
    return require('../package.json') as PackageJson;
}

export function createProgram(): Command {
    const pkg = loadPackageJson();

    const program = new Command();

    program
        .name('coiote')
        .description(pkg.description)
        .version(pkg.version, '-V, --version', 'Exibir versão do Coiote')
        .helpOption('-h, --help', 'Exibir ajuda')
        .argument('[prompt]', 'Tarefa a executar em linguagem natural')
        .option('-m, --model <model>', 'Modelo LLM a usar', 'claude-3-5-sonnet-latest')
        .option('-v, --verbose', 'Saída detalhada com raciocínio do LLM')
        .option('-q, --quiet', 'Apenas erros e resumo final')
        .option('-y, --auto', 'Confirmar todas as ações automaticamente')
        .option('--no-git', 'Desabilitar integração git')
        .action(async (prompt: string | undefined, options) => {
            if (!prompt) {
                program.help();
                return;
            }

            const reporter = new Reporter();
            if (options.verbose) reporter.verboseMode();
            if (options.quiet) reporter.quiet();

            const globalConf = new GlobalConfig();
            const keyManager = new KeyManager();

            let anthApiKey = await keyManager.getKey('anthropic');
            if (!anthApiKey) {
                console.error('❌ Chave da Anthropic não encontrada.');
                console.error('Configure usando: coiote config set-key anthropic sk-ant-...');
                process.exit(1);
            }

            const provider = new AnthropicProvider(anthApiKey, options.model);
            const permissions = new PermissionManager(reporter);
            if (options.auto) permissions.setMode('auto');

            const tools = new ToolRegistry();
            tools.register(readFileTool);
            tools.register(writeFileTool);
            tools.register(listFilesTool);
            tools.register(runCommandTool);
            // git tools
            tools.register(gitStatusTool);
            tools.register(gitDiffTool);
            tools.register(gitCommitTool);
            tools.register(gitBranchTool);

            const projectConfig = await ProjectConfigManager.load(process.cwd());

            const agent = new CoioteAgent({
                provider,
                reporter,
                permissions,
                tools,
                model: options.model,
                projectRoot: process.cwd(),
                globalConfig: globalConf,
                projectConfig
            });

            try {
                await agent.run(prompt);
            } catch (e: any) {
                console.error(`Falha Crítica do Loop Agêntico. (${e.message})`);
                process.exit(1);
            }
        });

    const configCmd = program.command('config')
        .description('Gerenciar configurações persistentes locais do Coiote');

    configCmd.command('show')
        .description('Mostra config atual')
        .action(() => {
            const globalConf = new GlobalConfig();
            console.log(JSON.stringify(globalConf.getAll(), null, 2));
        });

    configCmd.command('set <key> <value>')
        .description('Altera config local global')
        .action((key, value) => {
            const globalConf = new GlobalConfig();
            globalConf.set(key as any, value);
            console.log(`Configuração ${key} definida para ${value}`);
        });

    configCmd.command('set-key <provider> <key>')
        .description('Define chave segura no Keytar ou disco local')
        .action(async (provider, key) => {
            const globalConf = new GlobalConfig();
            const keyManager = new KeyManager();
            await keyManager.storeKey(provider, key);
            console.log(`✅ Chave API para O provider [${provider}] definida firmemente com Keychain / AES.`);
        });

    program.command('init')
        .description('Inicializa configurações de diretório local (coiote.config.md)')
        .action(async () => {
            const result = await initializeProject(process.cwd());
            if (result) {
                console.log('🐺 Arquivo `coiote.config.md` gerado com modelo padrão no CWD. Edite as intenções do projeto livremente.');
            } else {
                console.log('⚠️ Arquivo `coiote.config.md` já existente e intacto.');
            }
        });

    return program;
}

export async function run(): Promise<void> {
    const program = createProgram();
    await program.parseAsync(process.argv);
}

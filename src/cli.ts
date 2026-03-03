/**
 * Coiote CLI - Configuracao de comandos com Commander
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
import { ProviderFactory } from './providers/factory.js';
import { ToolRegistry } from './tools/registry.js';
import {
  readFileTool,
  writeFileTool,
  listFilesTool,
  editFileTool,
  deleteFileTool,
  searchFilesTool,
} from './tools/filesystem/index.js';
import { runCommandTool, runTestsTool, installPackageTool } from './tools/shell/index.js';
import { gitStatusTool, gitDiffTool, gitCommitTool, gitBranchTool } from './tools/git/index.js';
import { ProjectConfigManager } from './config/project-config.js';
import { SessionDAO } from './persistence/sessions.js';
import { ToolCallDAO } from './persistence/tool-calls.js';
import { DbClient } from './persistence/db.js';
import { HeadlessMode } from './utils/headless-mode.js';
import { TaskFileRunner } from './utils/task-runner.js';
import { isSlashCommand } from './agent/slash-commands.js';
import { AuditLog } from './audit/audit-log.js';
import { TUIComponents } from './ui/tui-components.js';
import { SyntaxHighlighter } from './ui/syntax-highlighter.js';
import fs from 'fs-extra';

interface PackageJson {
  version: string;
  description: string;
}

interface CliOptions {
  verbose?: boolean;
  quiet?: boolean;
  auto?: boolean;
  git?: boolean;
  model?: string;
  headless?: boolean;
  jsonPretty?: boolean;
  file?: string;
}

function loadPackageJson(): PackageJson {
  const require = createRequire(import.meta.url);
  return require('../package.json') as PackageJson;
}

async function runCoioteTask(
  prompt: string,
  options: CliOptions,
  headless?: HeadlessMode
): Promise<void> {
  const reporter = new Reporter();
  if (options.verbose) reporter.verboseMode();
  if (options.quiet) reporter.quiet();

  const globalConf = new GlobalConfig();
  const keyManager = new KeyManager();

  const providerName = options.model?.startsWith('gpt')
    ? 'openai'
    : options.model?.startsWith('claude')
      ? 'anthropic'
      : globalConf.get('defaultProvider');

  const provider = await ProviderFactory.create(
    providerName || 'anthropic',
    options.model || 'claude-3-5-sonnet-latest',
    keyManager
  );
  const permissions = new PermissionManager(reporter);
  if (options.auto) permissions.setMode('auto');

  const tools = new ToolRegistry();
  tools.register(readFileTool);
  tools.register(writeFileTool);
  tools.register(listFilesTool);
  tools.register(editFileTool);
  tools.register(deleteFileTool);
  tools.register(searchFilesTool);
  tools.register(runCommandTool);
  tools.register(runTestsTool);
  tools.register(installPackageTool);
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
    model: options.model || 'claude-3-5-sonnet-latest',
    projectRoot: process.cwd(),
    globalConfig: globalConf,
    projectConfig,
  });

  const auditLog = new AuditLog();
  auditLog.logSessionStart('cli-' + Date.now(), process.cwd());

  try {
    await agent.run(prompt);

    if (headless) {
      headless.success('Tarefa concluida com sucesso');
    }

    auditLog.logSessionEnd('cli-' + Date.now(), true);
  } catch (e: unknown) {
    const error = e instanceof Error ? e : new Error(String(e));

    if (headless) {
      headless.fail(error);
    } else {
      console.error('Falha Critica do Loop Agentico: ' + error.message);
    }

    auditLog.logSessionEnd('cli-' + Date.now(), false, { error: error.message });
    auditLog.logError(error, { prompt });

    throw e;
  } finally {
    auditLog.closeLog();
  }
}

async function runTaskFile(filePath: string, options: CliOptions): Promise<void> {
  const runner = new TaskFileRunner();
  const tasks = await runner.parseTasks(filePath);

  console.log('Tarefas carregadas: ' + tasks.length);

  const results = await runner.executeTasks(tasks, async (task) => {
    console.log('\nExecutando: ' + task.title);
    await runCoioteTask(task.description, options);
  });

  console.log('\nResultados:');
  console.log('  Concluidas: ' + results.completed);
  console.log('  Falharam: ' + results.failed);
  console.log('  Puladas: ' + results.skipped);
}

export function createProgram(): Command {
  const pkg = loadPackageJson();

  const program = new Command();

  program
    .name('coiote')
    .description(pkg.description)
    .version(pkg.version, '-V, --version', 'Exibir versao do Coiote')
    .helpOption('-h, --help', 'Exibir ajuda')
    .argument('[prompt]', 'Tarefa a executar em linguagem natural')
    .option('-m, --model <model>', 'Modelo LLM a usar', 'claude-3-5-sonnet-latest')
    .option('-v, --verbose', 'Saida detalhada com raciocinio do LLM')
    .option('-q, --quiet', 'Apenas erros e resumo final')
    .option('-y, --auto', 'Confirmar todas as acoes automaticamente')
    .option('--no-git', 'Desabilitar integracao git')
    .option('-H, --headless', 'Modo headless para CI/CD - sem prompts interativos')
    .option('--json-pretty', 'Saida JSON formatada (use com --headless)')
    .option('-f, --file <path>', 'Executar tarefas de um arquivo markdown')
    .action(async (prompt: string | undefined, options: CliOptions) => {
      // Modo headless
      if (HeadlessMode.isHeadless(process.argv)) {
        const headless = new HeadlessMode(HeadlessMode.parseArgs(process.argv));
        try {
          if (options.file) {
            const runner = new TaskFileRunner();
            const tasks = await runner.parseTasks(options.file);
            headless.setMessage('Tarefas carregadas: ' + tasks.length);
          } else if (!prompt) {
            headless.fail(new Error('Prompt requerido em modo headless'), 'Prompt requerido');
            return;
          } else {
            await runCoioteTask(prompt, options, headless);
          }
        } catch (e) {
          headless.fail(e);
        }
        return;
      }

      // Modo arquivo de tarefas
      if (options.file) {
        await runTaskFile(options.file, options);
        return;
      }

      if (!prompt) {
        program.help();
        return;
      }

      // Verificar slash commands
      if (isSlashCommand(prompt)) {
        const reporter = new Reporter();
        const { SlashCommandManager } = await import('./agent/slash-commands.js');
        const manager = new SlashCommandManager({
          projectRoot: process.cwd(),
          reporter,
        });
        await manager.execute(prompt);
        return;
      }

      await runCoioteTask(prompt, options);
    });

  const history = program.command('history').description('Gerenciar historico de sessoes');

  history
    .command('list')
    .alias('ls')
    .description('Listar sessoes recentes')
    .action(() => {
      const dao = new SessionDAO();
      const sessions = dao.listRecent(20);
      if (sessions.length === 0) {
        console.log('Nenhuma sessao encontrada.');
        return;
      }

      console.table(
        sessions.map((s) => ({
          ID: s.id.slice(0, 8),
          Projeto: s.projectName,
          Modelo: s.model,
          Data: new Date(s.createdAt).toLocaleString(),
          Status: s.status,
        }))
      );
    });

  history
    .command('show <id>')
    .description('Ver detalhes de uma sessao')
    .action((id: string) => {
      const sessionDao = new SessionDAO();
      const toolDao = new ToolCallDAO();

      const session = sessionDao.getById(id);
      if (!session) {
        const sessions = sessionDao.listRecent(100);
        const match = sessions.find((s) => s.id.startsWith(id));
        if (match) {
          displaySessionDetails(
            match as unknown as Record<string, unknown>,
            toolDao.listBySession(match.id) as unknown as Record<string, unknown>[]
          );
        } else {
          console.error('Sessao nao encontrada.');
        }
        return;
      }

      displaySessionDetails(
        session as unknown as Record<string, unknown>,
        toolDao.listBySession(session.id) as unknown as Record<string, unknown>[]
      );
    });

  const configCmd = program
    .command('config')
    .description('Gerenciar configuracoes persistentes locais do Coiote');

  configCmd
    .command('show')
    .description('Mostra config atual')
    .action(() => {
      const globalConf = new GlobalConfig();
      console.log(JSON.stringify(globalConf.getAll(), null, 2));
    });

  configCmd
    .command('set <key> <value>')
    .description('Altera config local global')
    .action((key: string, value: string) => {
      const globalConf = new GlobalConfig();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalConf as any).set(key, value);
      console.log('Configuracao ' + key + ' definida para ' + value);
    });

  configCmd
    .command('set-key <provider> <key>')
    .description('Define chave segura no Keytar ou disco local')
    .action(async (provider: string, key: string) => {
      const keyManager = new KeyManager();
      await keyManager.storeKey(provider, key);
      console.log('Chave API para o provider [' + provider + '] definida com sucesso.');
    });

  configCmd
    .command('set-provider <name>')
    .description('Define o provider padrao (anthropic, openai, ollama)')
    .action((name: string) => {
      const globalConf = new GlobalConfig();
      globalConf.set('defaultProvider', name as 'anthropic' | 'openai' | 'ollama');
      console.log('Provider padrao definido para: ' + name);
    });

  const dataCmd = program.command('data').description('Gerenciar dados locais e estatisticas');

  dataCmd
    .command('stats')
    .description('Exibir estatisticas de uso local')
    .action(async () => {
      const dao = new SessionDAO();
      const stats = dao.getStatistics();
      const dbPath = DbClient.getDbPath();
      const dbSize = (await fs.stat(dbPath)).size;

      console.log('\nESTATISTICAS DO COIOTE');
      console.log('--------------------------');
      console.log('Sessoes Totais:    ' + stats.sessionCount);
      console.log('Tarefas Totais:    ' + stats.taskCount);
      console.log('Tokens Consumidos: ' + stats.totalTokens.toLocaleString());
      console.log('Espaco em Disco:   ' + (dbSize / 1024 / 1024).toFixed(2) + ' MB');
      console.log('Local do DB:       ' + dbPath);
    });

  program
    .command('init')
    .description('Inicializa configuracoes de diretorio local (coiote.config.md)')
    .action(async () => {
      const result = await initializeProject(process.cwd());
      if (result) {
        console.log('Arquivo coiote.config.md gerado com modelo padrao no CWD.');
      } else {
        console.log('Arquivo coiote.config.md ja existente e intacto.');
      }
    });

  // Demo command to showcase TUI components
  program
    .command('demo')
    .description('Demonstrar componentes visuais do Coiote')
    .action(async () => {
      const { TUIComponents } = await import('./ui/tui-components.js');
      const { SyntaxHighlighter } = await import('./ui/syntax-highlighter.js');

      console.log(TUIComponents.header('Demonstracao de Componentes TUI'));

      // Alert types
      console.log(TUIComponents.alert('Informacao importante', 'info'));
      console.log(TUIComponents.alert('Operacao concluida com sucesso', 'success'));
      console.log(TUIComponents.alert('Cuidado: algo requer atencao', 'warning'));
      console.log(TUIComponents.alert('Falha na operacao', 'error'));

      // Box
      console.log(
        TUIComponents.box('Conteudo dentro de uma caixa', {
          title: 'Exemplo de Box',
          borderColor: 'cyan',
        })
      );

      // Table
      const tableData = [
        { Nome: 'Coiote', Versao: '0.1.0', Status: 'Ativo' },
        { Nome: 'Anthropic', Versao: 'API', Status: 'Conectado' },
        { Nome: 'OpenAI', Versao: 'API', Status: 'Disponivel' },
      ];
      console.log(TUIComponents.table(tableData));

      // List
      console.log(TUIComponents.header('Lista de Comandos'));
      console.log(
        TUIComponents.list(['coiote "tarefa"', 'coiote history', 'coiote config', 'coiote demo'], {
          numbered: true,
        })
      );

      // Progress bar
      console.log(TUIComponents.header('Barra de Progresso'));
      console.log(TUIComponents.progressBar(65, 100));

      // Code block with syntax highlighting
      console.log(TUIComponents.header('Codigo com Syntax Highlighting'));
      const code = `function hello(name: string): string {
  return "Hello, " + name + "!";
}`;
      const highlighter = new SyntaxHighlighter();
      console.log(TUIComponents.codeBlock(highlighter.highlight(code), 'typescript'));
    });

  return program;
}

export async function run(): Promise<void> {
  const program = createProgram();
  await program.parseAsync(process.argv);
}

function displaySessionDetails(session: Record<string, unknown>, tools: Record<string, unknown>[]) {
  console.log('\nSESSAO: ' + session.id);
  console.log('Projeto: ' + session.projectPath);
  console.log('Data: ' + new Date(String(session.createdAt)).toLocaleString());
  console.log('Modelo: ' + session.model);
  console.log(
    'Tokens: ' +
      session.totalTokens +
      ' (In: ' +
      session.inputTokens +
      ', Out: ' +
      session.outputTokens +
      ')'
  );
  console.log('Status: ' + session.status);

  if (tools.length > 0) {
    console.log('\nFERRAMENTAS EXECUTADAS:');
    console.table(
      tools.map((t: Record<string, unknown>) => ({
        Tool: t.toolName,
        Sucesso: t.success ? 'OK' : 'FALHA',
        Duracao: t.durationMs + 'ms',
        Resumo: t.summary,
      }))
    );
  }
}

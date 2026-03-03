# Coiote - Documentacao da API

> Versao: 0.1.0

---

## Sumario

1. [Arquitetura](#arquitetura)
2. [Agent](#agent)
3. [Providers](#providers)
4. [Tools](#tools)
5. [UI](#ui)
6. [Configuracao](#configuracao)
7. [CLI](#cli)

---

## Arquitetura

### Visao Geral

O Coiote segue uma arquitetura modular:

```
CLI Entry
    └── Agent Loop
          ├── Providers (LLM)
          ├── Tools
          │     ├── Filesystem
          │     ├── Shell
          │     └── Git
          ├── UI (Reporter)
          └── Permissions
```

---

## Agent

### CoioteAgent

Classe principal que coordena o loop agentico.

```typescript
import { CoioteAgent } from './agent/agent.js';

const agent = new CoioteAgent({
  provider,
  reporter,
  permissions,
  tools,
  model: 'claude-3-5-sonnet-latest',
  projectRoot: process.cwd(),
  globalConfig,
  projectConfig,
});

await agent.run('sua tarefa');
```

#### Metodos

| Metodo        | Descricao                            |
| ------------- | ------------------------------------ |
| `run(prompt)` | Executa o loop agentico com o prompt |
| `abort()`     | Aborta a execucao atual              |

---

## Providers

### LLMProvider (Interface)

Interface base para provedores de LLM.

```typescript
interface LLMProvider {
  name: string;
  chat(params: ChatParams): Promise<ChatResponse>;
  stream(params: ChatParams): AsyncIterable<StreamEvent>;
  supportsToolUse: boolean;
}
```

### Providers Disponiveis

| Provider             | Descricao                      |
| -------------------- | ------------------------------ |
| AnthropicProvider    | Claude ( Sonnet, Opus, Haiku ) |
| OpenAICompatProvider | GPT-4, Gemini, DeepSeek        |
| OllamaProvider       | Modelos locais                 |

### Factory

```typescript
import { ProviderFactory } from './providers/factory.js';

const provider = await ProviderFactory.create('anthropic', 'claude-3-5-sonnet-latest', keyManager);
```

---

## Tools

### Interface Tool

```typescript
interface Tool<TInput, TOutput> {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  requiresConfirmation: boolean;
  isDestructive: boolean;
  execute(input: TInput, context: ToolContext): Promise<ToolResult<TOutput>>;
}
```

### Tools Disponiveis

#### Filesystem

| Tool         | Descricao                  | Confirmation |
| ------------ | -------------------------- | ------------ |
| read_file    | Ler arquivo                | Nao          |
| write_file   | Criar/sobrescrever arquivo | Sim          |
| edit_file    | Editar arquivo             | Sim          |
| delete_file  | Deletar arquivo            | Sim          |
| list_files   | Listar arquivos            | Nao          |
| search_files | Buscar em arquivos         | Nao          |

#### Shell

| Tool            | Descricao        | Confirmation |
| --------------- | ---------------- | ------------ |
| run_command     | Executar comando | Sim          |
| run_tests       | Executar testes  | Sim          |
| install_package | Instalar pacote  | Sim          |

#### Git

| Tool       | Descricao          | Confirmation |
| ---------- | ------------------ | ------------ |
| git_status | Ver status         | Nao          |
| git_diff   | Ver mudancas       | Nao          |
| git_commit | Criar commit       | Sim          |
| git_branch | Gerenciar branches | Sim          |

---

## UI

### Reporter

Sistema de comunicacao com o usuario via eventos.

```typescript
const reporter = new Reporter();

reporter.on('plan', (data) => console.log(data.plan));
reporter.on('tool:call', (data) => console.log(data.tool));
reporter.on('error', (data) => console.log(data.error));
```

#### Eventos

| Evento      | Descricao               |
| ----------- | ----------------------- |
| plan        | Plano de execucao       |
| step:start  | Inicio de um passo      |
| tool:call   | Chamada de ferramenta   |
| tool:result | Resultado de ferramenta |
| step:done   | Passo concluido         |
| error       | Erro                    |
| warning     | Aviso                   |
| info        | Informacao              |
| done        | Tarefa concluida        |

### TUI Components

```typescript
import { TUIComponents } from './ui/tui-components.js';
import { SyntaxHighlighter } from './ui/syntax-highlighter.js';

// Box
TUIComponents.box('Conteudo', { title: 'Titulo', borderColor: 'cyan' });

// Alert
TUIComponents.alert('Mensagem', 'success');

// Table
TUIComponents.table([{ col1: 'valor' }]);

// Code Block
const code = 'const x = 1;';
const highlighter = new SyntaxHighlighter();
TUIComponents.codeBlock(highlighter.highlight(code));
```

### Theme

```typescript
import { ThemeManager, createTheme } from './ui/theme.js';

const theme = createTheme('auto'); // auto, light, dark
theme.toggle(); // Alterna entre light/dark
```

### Animations

```typescript
import { Animations } from './ui/animations.js';

const spinner = Animations.loading('Processando');
spinner.start();
// ... trabalho ...
spinner.stop('Concluido!');
```

---

## Configuracao

### GlobalConfig

```typescript
import { GlobalConfig } from './config/global-config.js';

const config = new GlobalConfig();
config.get('defaultProvider');
config.set('defaultProvider', 'openai');
config.getAll();
```

### ProjectConfig

```typescript
import { ProjectConfigManager } from './config/project-config.js';

const projectConfig = await ProjectConfigManager.load('./meu-projeto');
```

### coiote.config.md

```markdown
# Coiote - Configuracoes do Projeto

## Contexto do Projeto

[node|typescript]
[descricao breve]

## Comandos Uteis

- Testes: npm test
- Build: npm run build

## Permissoes

- Auto-commit: sim
- Perguntar antes de instalar: sim
```

---

## CLI

### Comandos

```bash
# Tarefa simples
coiote "adicione autenticacao JWT"

# Com opcoes
coiote "minha tarefa" -m claude-3-5-sonnet-latest -v

# Modo headless (CI/CD)
coiote --headless "tarefa"

# Arquivo de tarefas
coiote -f tarefas.md

# Historico
coiote history list
coiote history show <id>

# Configuracao
coiote config show
coiote config set-provider anthropic
coiote config set-key openai <key>

# Estatisticas
coiote data stats

# Demo TUI
coiote demo
```

### Opcoes

| Opcao         | Descricao          |
| ------------- | ------------------ |
| -m, --model   | Modelo LLM         |
| -v, --verbose | Saida detalhada    |
| -q, --quiet   | Apenas erros       |
| -y, --auto    | Auto confirmar     |
| --headless    | Modo CI/CD         |
| --json-pretty | JSON formatado     |
| -f, --file    | Arquivo de tarefas |

---

## Utils

### RateLimiter

```typescript
import { RateLimiter } from './utils/rate-limiter.js';

const limiter = new RateLimiter();
limiter.addTokens(1000);
const canContinue = limiter.canContinue();
```

### ErrorRecovery

```typescript
import { ErrorRecovery } from './utils/error-recovery.js';

const recovery = new ErrorRecovery();
const analysis = recovery.analyzeError(error);
```

### ExitCodes

```typescript
import { ExitCode, ExitCodeMapper } from './utils/exit-codes.js';

const code = ExitCodeMapper.fromError(error);
process.exit(code);
```

### HeadlessMode

```typescript
import { HeadlessMode } from './utils/headless-mode.js';

const headless = new HeadlessMode();
headless.success('Feito!', { filesModified: 5 });
```

---

_Documentacao gerada em 2026-03-03_

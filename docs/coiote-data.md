# 🐺 Coiote — Especificação de Dados

> **Documento:** coiote-data.md  
> **Versão:** 1.0  
> **Escopo:** Modelagem, persistência, fluxo e ciclo de vida de todos os dados do projeto

---

## Sumário

1. [Princípios de Dados](#1-princípios-de-dados)
2. [Categorias de Dados](#2-categorias-de-dados)
3. [Schema do Banco de Dados Local (SQLite)](#3-schema-do-banco-de-dados-local-sqlite)
4. [Configurações do Usuário](#4-configurações-do-usuário)
5. [Configuração de Projeto](#5-configuração-de-projeto)
6. [Dados em Trânsito — LLM API](#6-dados-em-trânsito--llm-api)
7. [Contexto do Agente (Runtime)](#7-contexto-do-agente-runtime)
8. [Fluxo de Dados Completo](#8-fluxo-de-dados-completo)
9. [Retenção e Limpeza de Dados](#9-retenção-e-limpeza-de-dados)
10. [Privacidade e LGPD](#10-privacidade-e-lgpd)

---

## 1. Princípios de Dados

O Coiote adota uma filosofia de **dados locais, mínimos e transparentes**:

**Local First:** Todos os dados persistidos ficam exclusivamente na máquina do usuário. Não há servidor central, telemetria oculta ou sincronização em nuvem.

**Mínimo Necessário:** Só persistimos o que é estritamente necessário para funcionalidade (histórico de sessão para retomada, configurações para UX). Nada de logs de comportamento, analytics de uso ou metadados de projeto.

**Transparente:** O usuário pode inspecionar, exportar e deletar todos os seus dados a qualquer momento com comandos simples.

**Não enviamos para a API do LLM:**
- Chaves de API de outros serviços
- Conteúdo de arquivos `.env`
- Arquivos explicitamente excluídos no `coiote.config.md`

---

## 2. Categorias de Dados

| Categoria | Onde vive | Persistência | Sensibilidade |
|-----------|-----------|-------------|---------------|
| Histórico de sessões | SQLite local | Permanente (até deletar) | Média — contém código do projeto |
| Mensagens do histórico | SQLite local | Permanente (até deletar) | Alta — contém código e contexto |
| Configurações globais | Arquivo JSON (via `conf`) | Permanente | Alta — contém chaves de API |
| Configuração de projeto | `coiote.config.md` | Permanente (no repo) | Baixa |
| Estado da sessão ativa | Memória (runtime) | Volátil | Alta — context window completo |
| Arquivos lidos do projeto | Memória (runtime) | Volátil | Alta — código proprietário |
| Respostas do LLM | Memória + SQLite | Volátil → Persistido | Média |

---

## 3. Schema do Banco de Dados Local (SQLite)

**Localização:** `~/.coiote/coiote.db`

### Tabela: `sessions`

Registra cada sessão de uso do Coiote.

```sql
CREATE TABLE sessions (
  id              TEXT    PRIMARY KEY,          -- UUID v4
  project_path    TEXT    NOT NULL,             -- Caminho absoluto do projeto
  project_name    TEXT    NOT NULL,             -- Nome do diretório raiz
  created_at      INTEGER NOT NULL,             -- Unix timestamp em ms
  last_active_at  INTEGER NOT NULL,             -- Unix timestamp em ms
  ended_at        INTEGER,                      -- NULL se sessão em andamento
  model           TEXT    NOT NULL,             -- Ex: "claude-sonnet-4-5"
  provider        TEXT    NOT NULL DEFAULT 'anthropic',
  total_tokens    INTEGER NOT NULL DEFAULT 0,   -- Total acumulado de tokens
  input_tokens    INTEGER NOT NULL DEFAULT 0,
  output_tokens   INTEGER NOT NULL DEFAULT 0,
  tasks_count     INTEGER NOT NULL DEFAULT 0,   -- Quantas tarefas foram executadas
  status          TEXT    NOT NULL DEFAULT 'active'
                  CHECK(status IN ('active', 'completed', 'aborted', 'error'))
);

CREATE INDEX idx_sessions_project ON sessions(project_path);
CREATE INDEX idx_sessions_created ON sessions(created_at DESC);
```

### Tabela: `tasks`

Cada tarefa enviada pelo usuário dentro de uma sessão.

```sql
CREATE TABLE tasks (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id      TEXT    NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  prompt          TEXT    NOT NULL,             -- Prompt original do usuário
  started_at      INTEGER NOT NULL,
  completed_at    INTEGER,
  status          TEXT    NOT NULL DEFAULT 'running'
                  CHECK(status IN ('running', 'completed', 'failed', 'aborted')),
  iterations      INTEGER NOT NULL DEFAULT 0,   -- Iterações do loop agêntico
  files_modified  INTEGER NOT NULL DEFAULT 0,
  files_created   INTEGER NOT NULL DEFAULT 0,
  commands_run    INTEGER NOT NULL DEFAULT 0,
  error_message   TEXT                          -- Se falhou, motivo legível
);

CREATE INDEX idx_tasks_session ON tasks(session_id);
```

### Tabela: `messages`

Histórico completo da conversa com o LLM — base para retomada de sessão.

```sql
CREATE TABLE messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id      TEXT    NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  task_id         INTEGER REFERENCES tasks(id),
  role            TEXT    NOT NULL CHECK(role IN ('user', 'assistant', 'tool_result')),
  content         TEXT    NOT NULL,             -- JSON serializado do content block
  created_at      INTEGER NOT NULL,
  tokens          INTEGER,                      -- Tokens deste bloco (estimado)
  is_compacted    INTEGER NOT NULL DEFAULT 0    -- 1 se foi compactado
);

CREATE INDEX idx_messages_session ON messages(session_id, created_at);
```

### Tabela: `tool_calls`

Log de cada chamada de ferramenta — para auditoria e debug.

```sql
CREATE TABLE tool_calls (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id         INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tool_name       TEXT    NOT NULL,
  input_json      TEXT    NOT NULL,             -- JSON do input (sem conteúdo de arquivo)
  result_success  INTEGER NOT NULL,             -- 0 ou 1
  result_summary  TEXT    NOT NULL,             -- Resumo legível do resultado
  duration_ms     INTEGER,
  created_at      INTEGER NOT NULL
);

CREATE INDEX idx_tool_calls_task ON tool_calls(task_id);
```

### Tabela: `project_snapshots`

Estado do projeto capturado no início de cada sessão (estrutura de arquivos, não conteúdo).

```sql
CREATE TABLE project_snapshots (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id      TEXT    NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  file_tree_json  TEXT    NOT NULL,             -- Árvore de arquivos (sem conteúdo)
  git_branch      TEXT,
  git_commit_hash TEXT,
  created_at      INTEGER NOT NULL
);
```

### Migrations

O Coiote usa um sistema de migrations simples para evoluir o schema:

```typescript
// src/persistence/migrations/index.ts
const MIGRATIONS: Migration[] = [
  { version: 1, up: createInitialSchema },
  { version: 2, up: addProjectSnapshots },
  // Próximas migrations aqui
];

// Controle de versão do schema
db.exec(`
  CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER NOT NULL,
    applied_at INTEGER NOT NULL
  )
`);
```

---

## 4. Configurações do Usuário

**Localização (via `conf`):**

| OS | Caminho |
|----|---------|
| Linux | `~/.config/coiote/config.json` |
| macOS | `~/Library/Preferences/coiote/config.json` |
| Windows | `%APPDATA%\coiote\config.json` |

### Schema das Configurações Globais

```typescript
interface GlobalConfig {
  // LLM
  defaultProvider: 'anthropic' | 'openai' | 'ollama';
  defaultModel: string;                           // ex: "claude-sonnet-4-5"

  // Comportamento
  defaultPermissionLevel: 'ask-all' | 'ask-destructive' | 'auto';
  autoCommit: boolean;                            // Commit automático após tarefas
  verbosity: 'quiet' | 'normal' | 'verbose';

  // Chaves de API (NUNCA logadas, criptografadas em disco)
  apiKeys: {
    anthropic?: string;   // ANTHROPIC_API_KEY
    openai?: string;      // OPENAI_API_KEY
  };

  // Histórico
  maxSessionsToKeep: number;                      // Default: 100
  maxMessagesPerSession: number;                  // Default: 1000

  // UI
  colorScheme: 'auto' | 'light' | 'dark';
  language: 'pt-BR' | 'en-US';
}
```

**Chaves de API:** Armazenadas com keytar (Keychain do OS) quando disponível, ou criptografadas com AES-256 derivado de UID do usuário. Nunca em plaintext. Ver `coiote-security.md`.

---

## 5. Configuração de Projeto

**Arquivo:** `coiote.config.md` na raiz do projeto (commitável no git).

### Schema Parseado

```typescript
interface ProjectConfig {
  // Contexto do projeto (enviado ao LLM como contexto)
  context: string;                               // Texto livre de descrição

  // Comandos do projeto
  commands: {
    test?: string;                               // Ex: "npm test"
    build?: string;                              // Ex: "npm run build"
    lint?: string;                               // Ex: "npm run lint"
    dev?: string;                                // Ex: "npm run dev"
    custom?: Record<string, string>;
  };

  // Convenções de código (instruções para o LLM)
  conventions: string[];

  // Permissões específicas do projeto
  permissions: {
    autoApprove: string[];                       // Padrões de ferramentas/caminhos
    alwaysConfirm: string[];
    neverDo: string[];
    protectedPaths: string[];                    // Paths nunca modificados
    sensitiveFiles: string[];                    // Nunca enviar ao LLM
  };

  // Contexto de arquivos a incluir sempre
  alwaysInclude: string[];                       // Globs ex: ["src/types/**/*.ts"]

  // Contexto de arquivos a ignorar
  ignore: string[];                              // Além do .gitignore
}
```

### Parser do coiote.config.md

O arquivo é Markdown estruturado com seções reconhecidas por heading:

```markdown
# Coiote — Configurações do Projeto

## Contexto do Projeto
API REST em Node.js + TypeScript com PostgreSQL.

## Comandos
- Testes: `npm test`
- Build: `npm run build`

## Convenções
- Usar TypeScript strict
- Commits no padrão Conventional Commits em português

## Permissões
### Aprovação automática
- Leitura de qualquer arquivo
- Execução de: npm test, npm build

### Sempre confirmar
- Modificação de arquivos em: src/core/

### Nunca fazer
- Modificar arquivos .env
- Executar rm -rf

### Arquivos sensíveis (nunca enviar ao LLM)
- .env
- .env.*
- secrets/
```

---

## 6. Dados em Trânsito — LLM API

### O que é enviado à API

```typescript
interface LLMRequest {
  model: string;
  system: string;          // System prompt do Coiote (sem dados do usuário)
  messages: Message[];     // Histórico da conversa
  tools: ToolDefinition[]; // Definições das tools (sem dados sensíveis)
  max_tokens: number;
}

// Uma mensagem pode conter:
type MessageContent =
  | { type: 'text'; text: string }            // Prompt, raciocínio, código
  | { type: 'tool_use'; ... }                 // Chamada de tool
  | { type: 'tool_result'; ... };             // Resultado de tool
```

### O que NUNCA é enviado à API

```typescript
const NEVER_SEND_TO_LLM = [
  '.env',
  '.env.*',
  '*.pem',
  '*.key',
  '*.p12',
  '*.pfx',
  // Qualquer arquivo listado em config.permissions.sensitiveFiles
  // Arquivos > 500KB (truncados automaticamente)
];
```

### Rastreamento de Tokens

```typescript
interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;      // Cache do Anthropic prompt caching
  cacheWriteTokens?: number;
  estimatedCostUsd?: number;     // Calculado com tabela de preços local
}
```

Tokens são persistidos por sessão e exibidos no resumo final.

---

## 7. Contexto do Agente (Runtime)

Dados em memória durante a execução de uma tarefa — não persistidos diretamente.

```typescript
interface AgentRuntimeContext {
  // Sessão
  sessionId: string;
  taskId: number;

  // Configuração ativa
  projectConfig: ProjectConfig;
  globalConfig: GlobalConfig;

  // Estado do loop agêntico
  conversationHistory: Message[];
  currentIteration: number;
  filesModifiedThisTask: Set<string>;
  commandsRunThisTask: string[];

  // Contexto do projeto
  projectRoot: string;
  projectStructure: FileTree;
  gitState: GitState;

  // Métricas
  startedAt: number;
  tokenUsage: TokenUsage;
}
```

### Context Window Management

```
Total context window: 200.000 tokens (Claude Sonnet/Opus)
│
├── System prompt: ~2.000 tokens (fixo)
├── Project config: ~1.000 tokens (fixo)
├── File context: até 80.000 tokens (variável)
├── Conversation history: até 100.000 tokens (compactado quando necessário)
└── Reserva para resposta: ~8.000 tokens
                           ─────────────
                           Total: ~191.000 / 200.000
```

**Estratégia de compactação:**
Quando o histórico atinge 100.000 tokens, o Coiote usa o modelo `haiku` (mais barato/rápido) para gerar um resumo do que foi feito até agora e substitui o histórico antigo pelo resumo.

---

## 8. Fluxo de Dados Completo

```
Usuário digita prompt
        │
        ▼
  ProjectConfig.load()           ← lê coiote.config.md
  GlobalConfig.load()            ← lê ~/.config/coiote/config.json
        │
        ▼
  Session.create()               → persiste em sessions (SQLite)
  Task.create()                  → persiste em tasks (SQLite)
        │
        ▼
  ProjectContext.scan()          → lê estrutura de arquivos (RAM)
  GitState.capture()             → git status/log (RAM)
        │
        ▼
  LLM API Request                → envia histórico + tools
        │
        ▼
  LLM responde com tool_calls
        │
        ├── ToolCall.log()       → persiste em tool_calls (SQLite)
        ├── Permission.check()   → verifica regras + pergunta usuário
        ├── Tool.execute()       → executa ação no filesystem/shell/git
        └── Message.append()    → adiciona ao histórico em RAM
        │
        [loop até sem tool_calls]
        │
        ▼
  Session.update() / Task.complete()  → atualiza SQLite
  Messages.persist()                  → persiste histórico em SQLite
        │
        ▼
  Reporter.done()                → exibe resumo para o usuário
```

---

## 9. Retenção e Limpeza de Dados

### Política de Retenção

| Dado | Retenção padrão | Configurável |
|------|----------------|-------------|
| Sessões | 90 dias | ✅ |
| Mensagens de sessões antigas | 90 dias | ✅ |
| Tool calls logs | 90 dias | ✅ |
| Configurações globais | Indefinida | Não |
| Configuração de projeto | Indefinida (no git) | Não |

### Comandos de Gestão de Dados

```bash
# Ver quanto espaço o Coiote usa
coiote data stats

# Listar sessões recentes
coiote history

# Deletar sessão específica
coiote history delete <session-id>

# Limpar histórico antigo (mantém últimas 30 sessões)
coiote data cleanup --keep 30

# Deletar TODOS os dados (irreversível)
coiote data clear --all

# Exportar histórico para JSON
coiote history export --output coiote-history.json

# Deletar chaves de API armazenadas
coiote config clear-keys
```

### Auto-limpeza

```typescript
// Executa uma vez por semana, na inicialização
async function autoCleanup(db: Database, config: GlobalConfig): Promise<void> {
  const cutoffDate = Date.now() - config.maxSessionsRetentionDays * 86_400_000;

  db.prepare(`
    DELETE FROM sessions
    WHERE created_at < ?
    AND id NOT IN (
      SELECT id FROM sessions ORDER BY last_active_at DESC LIMIT ?
    )
  `).run(cutoffDate, config.maxSessionsToKeep);
}
```

---

## 10. Privacidade e LGPD

O Coiote é uma ferramenta local. Não há tratamento de dados pessoais no sentido da LGPD, pois:

- Não coletamos dados para um servidor controlado por nós
- Não há cadastro ou identificação de usuários
- Todos os dados ficam no dispositivo do próprio usuário

**Em relação aos provedores de LLM:**
Ao usar o Coiote com a API da Anthropic (ou outros provedores), o código do projeto do usuário é enviado à API do respectivo provedor. O usuário é responsável por:
- Verificar os termos de uso e política de privacidade do provedor escolhido
- Não incluir dados pessoais de terceiros no código enviado
- Utilizar os recursos de exclusão de arquivos sensíveis (`sensitiveFiles` no config)

O Coiote exibe um aviso sobre isso no primeiro uso.

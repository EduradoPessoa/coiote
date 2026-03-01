# 🐺 Coiote — Guia de Desenvolvimento

> **Documento:** coiote-development.md  
> **Versão:** 1.0  
> **Escopo:** Especificação, boas práticas e padrões de desenvolvimento do projeto

---

## Sumário

1. [Estrutura do Projeto](#1-estrutura-do-projeto)
2. [Arquitetura de Módulos](#2-arquitetura-de-módulos)
3. [Padrões de Código](#3-padrões-de-código)
4. [Sistema de Tools (Ferramentas do Agente)](#4-sistema-de-tools)
5. [Camada de Comunicação (Reporter)](#5-camada-de-comunicação-reporter)
6. [Loop Agêntico](#6-loop-agêntico)
7. [Tratamento de Erros](#7-tratamento-de-erros)
8. [Testes](#8-testes)
9. [Git e Controle de Versão](#9-git-e-controle-de-versão)
10. [Performance e Otimizações](#10-performance-e-otimizações)
11. [Checklist de Code Review](#11-checklist-de-code-review)

---

## 1. Estrutura do Projeto

```
coiote/
├── src/
│   ├── index.ts                  # Entrypoint — parse de args e boot
│   ├── cli.ts                    # Commander config e routing de comandos
│   │
│   ├── agent/
│   │   ├── agent.ts              # Loop agêntico principal
│   │   ├── planner.ts            # Geração e exibição de planos
│   │   ├── context-manager.ts    # Gerenciamento do context window
│   │   └── compactor.ts          # Compactação de histórico longo
│   │
│   ├── providers/
│   │   ├── types.ts              # Interface LLMProvider
│   │   ├── anthropic.ts          # Provider Anthropic Claude
│   │   ├── openai.ts             # Provider OpenAI compatível
│   │   └── factory.ts            # Factory para instanciar provider
│   │
│   ├── tools/
│   │   ├── types.ts              # Interface Tool + ToolResult
│   │   ├── registry.ts           # Registro central de tools
│   │   ├── filesystem/
│   │   │   ├── read-file.ts
│   │   │   ├── write-file.ts
│   │   │   ├── edit-file.ts
│   │   │   ├── delete-file.ts
│   │   │   ├── list-files.ts
│   │   │   └── search-files.ts
│   │   ├── shell/
│   │   │   ├── run-command.ts
│   │   │   ├── run-tests.ts
│   │   │   └── install-package.ts
│   │   └── git/
│   │       ├── git-status.ts
│   │       ├── git-diff.ts
│   │       ├── git-commit.ts
│   │       └── git-branch.ts
│   │
│   ├── ui/
│   │   ├── reporter.ts           # Event bus de comunicação com o usuário
│   │   ├── components/
│   │   │   ├── PlanDisplay.tsx   # Exibição do plano de execução
│   │   │   ├── StepProgress.tsx  # Progresso de passos
│   │   │   ├── DiffPreview.tsx   # Preview de arquivo antes de escrever
│   │   │   ├── ErrorDisplay.tsx  # Exibição de erros com contexto
│   │   │   └── DoneDisplay.tsx   # Resumo final
│   │   └── prompts.ts            # Wrappers de @inquirer/prompts
│   │
│   ├── permissions/
│   │   ├── permission-manager.ts # Lógica central de permissões
│   │   ├── session-config.ts     # Configuração de nível por sessão
│   │   └── rules.ts              # Regras permanentes (destructive, sensitive)
│   │
│   ├── persistence/
│   │   ├── db.ts                 # Singleton da conexão SQLite
│   │   ├── sessions.ts           # DAO de sessões
│   │   └── messages.ts           # DAO de mensagens
│   │
│   ├── config/
│   │   ├── global-config.ts      # Conf (preferências do usuário)
│   │   └── project-config.ts     # Parser do coiote.config.md
│   │
│   └── utils/
│       ├── tokens.ts             # Contagem e estimativa de tokens
│       ├── diff.ts               # Geração de diffs legíveis
│       └── file-size.ts          # Helpers de tamanho de arquivo
│
├── test/
│   ├── unit/                     # Testes por módulo espelhando src/
│   ├── integration/              # Testes fim-a-fim com LLM mockado
│   └── fixtures/                 # Projetos fictícios para testes
│
├── docs/                         # Documentação do projeto
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── eslint.config.mjs
├── .prettierrc
└── package.json
```

---

## 2. Arquitetura de Módulos

### Regras de Dependência entre Módulos

```
index.ts
  └── cli.ts
        └── agent/agent.ts
              ├── providers/*        (sem deps de ui)
              ├── tools/*            (sem deps de ui, sem deps de agent)
              ├── ui/reporter.ts     (sem deps de agent ou tools)
              └── permissions/*      (sem deps de ui)

REGRAS:
  ✅ agent pode importar: providers, tools, ui, permissions, persistence, config
  ✅ tools podem importar: utils, config
  ✅ ui pode importar: utils
  ❌ tools NÃO podem importar: agent, ui, permissions
  ❌ ui NÃO pode importar: agent, tools, providers
  ❌ providers NÃO podem importar: tools, ui, permissions
```

**Por que estas regras importam:**
- Tools precisam ser testáveis de forma isolada, sem dependência da UI
- A UI só recebe eventos — nunca executa lógica de negócio
- Providers só sabem sobre LLMs — nada de filesystem ou terminal

### Padrão de Event Bus para UI

A comunicação entre o agente e a UI acontece através de um **Event Bus unidirecional**, não por chamadas diretas:

```typescript
// src/ui/reporter.ts
import { EventEmitter } from 'events';

type CoioteEvent =
  | { type: 'plan'; plan: ExecutionPlan }
  | { type: 'step:start'; step: Step; current: number; total: number }
  | { type: 'tool:call'; tool: string; args: Record<string, unknown> }
  | { type: 'tool:result'; tool: string; success: boolean; summary: string }
  | { type: 'step:done'; step: Step }
  | { type: 'error'; error: CoioteError }
  | { type: 'warning'; message: string; context?: string }
  | { type: 'done'; summary: ExecutionSummary };

export class Reporter extends EventEmitter {
  emit<T extends CoioteEvent['type']>(
    event: T,
    data: Extract<CoioteEvent, { type: T }>
  ): boolean {
    return super.emit(event, data);
  }
  
  // Atalhos semânticos
  plan(plan: ExecutionPlan) { this.emit('plan', { type: 'plan', plan }); }
  toolCall(tool: string, args: Record<string, unknown>) {
    this.emit('tool:call', { type: 'tool:call', tool, args });
  }
  // ...
}
```

---

## 3. Padrões de Código

### 3.1 Nomenclatura

| Elemento | Convenção | Exemplo |
|----------|-----------|---------|
| Arquivos | kebab-case | `write-file.ts`, `git-commit.ts` |
| Classes | PascalCase | `PermissionManager`, `AnthropicProvider` |
| Interfaces/Types | PascalCase com prefixo | `ToolResult`, `LLMProvider`, `CoioteConfig` |
| Funções | camelCase | `readFileTool`, `formatDiff` |
| Constantes | UPPER_SNAKE_CASE | `MAX_CONTEXT_TOKENS`, `DEFAULT_MODEL` |
| Componentes React (ink) | PascalCase | `PlanDisplay`, `ErrorDisplay` |

### 3.2 Tipagem — Regras Estritas

**Nunca use `any`. Use `unknown` e faça type narrowing:**

```typescript
// ❌ Errado
function parseConfig(raw: any): Config { ... }

// ✅ Correto
function parseConfig(raw: unknown): Config {
  if (!isValidConfig(raw)) {
    throw new ConfigParseError('Configuração inválida');
  }
  return raw;
}

function isValidConfig(val: unknown): val is Config {
  return (
    typeof val === 'object' &&
    val !== null &&
    'model' in val &&
    typeof (val as Config).model === 'string'
  );
}
```

**Use Result types para operações que podem falhar:**

```typescript
// src/utils/result.ts
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const err = <E = Error>(error: E): Result<never, E> => ({ ok: false, error });
```

```typescript
// Uso nas tools
async function readFile(path: string): Promise<Result<string, FileError>> {
  try {
    const content = await fs.readFile(path, 'utf-8');
    return ok(content);
  } catch (e) {
    return err(new FileError(`Arquivo não encontrado: ${path}`));
  }
}
```

### 3.3 Async — Regras

**Toda operação I/O é async. Nunca bloqueie o event loop:**

```typescript
// ❌ Errado — operação síncrona que bloqueia
import { readFileSync } from 'fs';
const content = readFileSync(path, 'utf-8');

// ✅ Correto
import { readFile } from 'fs/promises';
const content = await readFile(path, 'utf-8');
```

**Sempre capture erros de Promises:**

```typescript
// ❌ Errado — unhandled rejection
someAsyncOperation();

// ✅ Correto
await someAsyncOperation();

// ✅ Ou com tratamento explícito
someAsyncOperation().catch(handleError);
```

**Use `AbortController` para operações canceláveis:**

```typescript
export class Agent {
  private abortController = new AbortController();

  async run(prompt: string): Promise<void> {
    // Passar signal para todas as operações longas
    await this.provider.stream(params, { signal: this.abortController.signal });
  }

  abort(): void {
    this.abortController.abort();
  }
}
```

### 3.4 Imports

**Usar barrel exports por módulo, não importar arquivos internos diretamente:**

```typescript
// ❌ Errado — acoplamento a estrutura interna
import { readFileTool } from '../tools/filesystem/read-file';

// ✅ Correto — via barrel
import { readFileTool } from '../tools/filesystem';
```

**Order de imports (enforced pelo eslint):**
1. Node.js built-ins (`path`, `os`, `fs/promises`)
2. Dependências externas
3. Imports internos absolutos (via `paths` no tsconfig)
4. Imports relativos

---

## 4. Sistema de Tools

### Interface de uma Tool

```typescript
// src/tools/types.ts
export interface Tool<TInput, TOutput> {
  /** Nome da tool — deve ser snake_case, único no registro */
  name: string;

  /** Descrição enviada ao LLM para ele saber quando usar */
  description: string;

  /** Schema JSON da entrada (usado para validação e para o LLM) */
  inputSchema: JSONSchema;

  /** Requer confirmação do usuário antes de executar? */
  requiresConfirmation: boolean;

  /** É uma operação destrutiva/irreversível? */
  isDestructive: boolean;

  /** Executa a tool e retorna o resultado */
  execute(input: TInput, context: ToolContext): Promise<ToolResult<TOutput>>;
}

export interface ToolContext {
  projectRoot: string;
  reporter: Reporter;
  permissionManager: PermissionManager;
  signal: AbortSignal;
}

export interface ToolResult<T = unknown> {
  success: boolean;
  value?: T;
  error?: string;          // Mensagem legível para humanos
  rawError?: unknown;      // Erro original para debug
  summary: string;         // Resumo de uma linha exibido na UI
}
```

### Implementando uma Tool

```typescript
// src/tools/filesystem/write-file.ts
import { Tool, ToolResult } from '../types';
import { generateDiff } from '../../utils/diff';
import fs from 'fs-extra';

interface WriteFileInput {
  path: string;
  content: string;
  createDirectories?: boolean;
}

export const writeFileTool: Tool<WriteFileInput, void> = {
  name: 'write_file',
  description: 'Cria ou sobrescreve um arquivo com o conteúdo fornecido. ' +
    'Sempre exibe um preview/diff antes de escrever.',
  requiresConfirmation: true,
  isDestructive: false,  // Pode ser revertido via git

  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Caminho relativo ao projeto' },
      content: { type: 'string', description: 'Conteúdo completo do arquivo' },
      createDirectories: { type: 'boolean', default: true },
    },
    required: ['path', 'content'],
  },

  async execute(input, ctx): Promise<ToolResult<void>> {
    const fullPath = path.resolve(ctx.projectRoot, input.path);

    // Gerar e exibir diff/preview
    const existing = await fs.pathExists(fullPath)
      ? await fs.readFile(fullPath, 'utf-8')
      : null;

    const diff = existing
      ? generateDiff(existing, input.content, input.path)
      : `[Novo arquivo — ${input.content.split('\n').length} linhas]`;

    ctx.reporter.toolCall('write_file', { path: input.path, diff });

    // Pedir confirmação
    const allowed = await ctx.permissionManager.request({
      tool: 'write_file',
      path: input.path,
      preview: diff,
      isOverwrite: existing !== null,
    });

    if (!allowed) {
      return { success: false, error: 'Cancelado pelo usuário', summary: `Escrita em ${input.path} cancelada` };
    }

    try {
      if (input.createDirectories) {
        await fs.outputFile(fullPath, input.content, 'utf-8');
      } else {
        await fs.writeFile(fullPath, input.content, 'utf-8');
      }
      return { success: true, summary: `Arquivo escrito: ${input.path}` };
    } catch (e) {
      return {
        success: false,
        error: `Não foi possível escrever o arquivo: ${(e as Error).message}`,
        rawError: e,
        summary: `Erro ao escrever ${input.path}`,
      };
    }
  },
};
```

### Registro de Tools

```typescript
// src/tools/registry.ts
import { Tool } from './types';

export class ToolRegistry {
  private tools = new Map<string, Tool<unknown, unknown>>();

  register(tool: Tool<unknown, unknown>): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool '${tool.name}' já está registrada`);
    }
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool<unknown, unknown> {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Tool desconhecida: ${name}`);
    return tool;
  }

  // Converte para formato que o LLM entende
  toAnthropicFormat(): Anthropic.Tool[] {
    return [...this.tools.values()].map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    }));
  }
}
```

---

## 5. Camada de Comunicação (Reporter)

O Reporter é o **único canal de comunicação com o usuário**. Nenhum módulo deve chamar `console.log` diretamente.

### Regra de Ouro

```typescript
// ❌ NUNCA faça isso em qualquer módulo que não seja a UI
console.log('Lendo arquivo...');
process.stdout.write('...');

// ✅ SEMPRE emita um evento pelo Reporter
ctx.reporter.toolCall('read_file', { path });
```

### Mensagens Estruturadas vs. Livres

```typescript
// ✅ Use métodos semânticos quando disponível
reporter.plan(executionPlan);
reporter.stepStart(step, current, total);
reporter.toolCall('write_file', { path, diff });
reporter.error(coioteError);
reporter.done(summary);

// ✅ Para mensagens informativas sem método específico
reporter.info('Nenhuma alteração detectada no codebase');
reporter.warning('Arquivo muito grande — truncando para 1000 linhas');
```

### Verbosidade

```typescript
// Mensagens só exibidas em modo verbose
reporter.verbose('Context window: 45.234 / 200.000 tokens');
reporter.verbose(`LLM reasoning: ${thinkingText}`);
```

---

## 6. Loop Agêntico

### Estrutura Principal

```typescript
// src/agent/agent.ts
export class CoioteAgent {
  async run(prompt: string): Promise<void> {
    // 1. Carregar contexto do projeto
    const context = await this.loadProjectContext();

    // 2. Gerar e exibir plano
    const plan = await this.planner.generate(prompt, context);
    this.reporter.plan(plan);

    const confirmed = await this.permissions.confirmPlan(plan);
    if (!confirmed) return;

    // 3. Executar loop agêntico
    const history: Message[] = [
      { role: 'user', content: buildUserMessage(prompt, context) }
    ];

    let iteration = 0;
    const MAX_ITERATIONS = 50; // Proteção contra loops infinitos

    while (iteration < MAX_ITERATIONS) {
      iteration++;

      const response = await this.provider.stream({
        model: this.config.model,
        tools: this.tools.toAnthropicFormat(),
        messages: history,
        system: SYSTEM_PROMPT,
      });

      // Verificar se há tool calls
      const toolCalls = extractToolCalls(response);

      if (toolCalls.length === 0) {
        // LLM terminou — sem mais tool calls
        break;
      }

      // Executar todas as tool calls
      const toolResults = await this.executeToolCalls(toolCalls);

      // Adicionar ao histórico
      history.push({ role: 'assistant', content: response.content });
      history.push({ role: 'user', content: buildToolResultMessage(toolResults) });

      // Compactar contexto se necessário
      if (estimateTokens(history) > CONTEXT_COMPACTION_THRESHOLD) {
        history = await this.compactor.compact(history);
        this.reporter.info('Histórico compactado para liberar contexto');
      }
    }

    // 4. Resumo final
    this.reporter.done(buildSummary(history));
  }
}
```

### Proteções do Loop

```typescript
const LOOP_GUARDS = {
  MAX_ITERATIONS: 50,
  MAX_TOKENS: 180_000,           // 90% do context window
  MAX_TOOL_CALLS_PER_STEP: 10,
  CONTEXT_COMPACTION_THRESHOLD: 100_000,
  MAX_EXECUTION_TIME_MS: 10 * 60 * 1000, // 10 minutos
};
```

---

## 7. Tratamento de Erros

### Hierarquia de Erros

```typescript
// src/errors.ts

// Erro base do Coiote
export class CoioteError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CoioteError';
  }
}

// Erros específicos
export class ToolExecutionError extends CoioteError {
  constructor(
    public readonly toolName: string,
    message: string,
    public readonly attempted: string[],  // O que foi tentado
    public readonly rawError?: unknown,
  ) {
    super(message, ErrorCode.TOOL_EXECUTION_FAILED, { toolName, attempted });
  }
}

export class PermissionDeniedError extends CoioteError { ... }
export class ProviderError extends CoioteError { ... }
export class ConfigurationError extends CoioteError { ... }
export class ContextOverflowError extends CoioteError { ... }
```

### Padrão de Tratamento no Agent

```typescript
// Nunca deixar erros de tool propagarem sem tratamento
try {
  const result = await tool.execute(input, ctx);
  if (!result.success) {
    // Erro esperado — exibir e oferecer opções
    reporter.error({
      tool: tool.name,
      what: result.error!,
      why: result.rawError,
      attempted: result.attempted,
      options: buildRecoveryOptions(tool, result),
    });
    const choice = await prompts.selectRecovery(options);
    return handleRecoveryChoice(choice);
  }
} catch (e) {
  // Erro inesperado — não suprimir, sempre exibir
  reporter.error({
    tool: tool.name,
    what: 'Erro inesperado na execução da ferramenta',
    why: e,
    attempted: [],
    options: [{ label: 'Abortar tarefa', value: 'abort' }],
  });
  throw new ToolExecutionError(tool.name, (e as Error).message, []);
}
```

---

## 8. Testes

### Estrutura de Testes por Tipo

**Testes de Unidade** — Para tools, utils e lógica pura:

```typescript
// test/unit/tools/write-file.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { writeFileTool } from '../../../src/tools/filesystem/write-file';
import { createMockContext } from '../../helpers/mock-context';

describe('writeFileTool', () => {
  let ctx: ToolContext;

  beforeEach(() => {
    ctx = createMockContext({
      permissionManager: { request: vi.fn().mockResolvedValue(true) },
    });
  });

  it('deve criar arquivo e retornar sucesso', async () => {
    const result = await writeFileTool.execute(
      { path: 'test.ts', content: 'export const x = 1;' },
      ctx,
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('test.ts');
  });

  it('deve retornar erro quando permissão negada', async () => {
    ctx.permissionManager.request = vi.fn().mockResolvedValue(false);
    const result = await writeFileTool.execute({ path: 'test.ts', content: '' }, ctx);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Cancelado');
  });
});
```

**Testes de Integração** — Com LLM mockado:

```typescript
// test/integration/agent-jwt.test.ts
import { describe, it, expect } from 'vitest';
import { CoioteAgent } from '../../src/agent/agent';
import { MockProvider } from '../helpers/mock-provider';
import { TempProject } from '../helpers/temp-project';

describe('Agent — autenticação JWT', () => {
  it('deve criar middleware e modificar rota', async () => {
    const project = await TempProject.fromFixture('express-api');
    const agent = new CoioteAgent({
      provider: new MockProvider({ fixture: 'jwt-auth-responses' }),
      projectRoot: project.path,
    });

    await agent.run('adicione autenticação JWT ao endpoint /api/users');

    expect(await project.fileExists('src/middleware/auth.ts')).toBe(true);
    expect(await project.fileContains('src/routes/users.ts', 'authMiddleware')).toBe(true);
  });
});
```

### Fixture de Projeto para Testes

```
test/fixtures/
├── express-api/                  # Projeto Express simples
│   ├── src/
│   │   ├── routes/users.js
│   │   └── middleware/index.js
│   └── package.json
├── react-app/                    # App React (CRA)
└── python-flask/                 # Projeto Python Flask
```

---

## 9. Git e Controle de Versão

### Conventional Commits (obrigatório)

```
<type>(<scope>): <description>

[body opcional]

[footer opcional]
```

**Types:**

| Type | Quando usar |
|------|-------------|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Apenas documentação |
| `refactor` | Refatoração sem mudança de comportamento |
| `test` | Adicionar ou corrigir testes |
| `chore` | Manutenção, deps, config |
| `perf` | Melhoria de performance |

**Exemplos:**
```
feat(tools): add git-commit tool with auto-message generation
fix(agent): prevent infinite loop when LLM response has no tool calls
docs(stack): add ADR-005 for LLM provider abstraction
```

### Workflow de Branches

```
main (protegida, sempre deployável)
  └── develop (branch de integração)
        ├── feat/jwt-tool
        ├── feat/context-compaction
        ├── fix/spinner-flicker
        └── chore/update-anthropic-sdk
```

**Regras:**
- Nunca commit direto em `main`
- PRs requerem review de ao menos 1 desenvolvedor
- CI deve passar (lint + testes) antes do merge
- Squash merge para manter histórico linear em `main`

---

## 10. Performance e Otimizações

### Startup Time

**Meta:** `coiote --version` em < 300ms.

```typescript
// ✅ Lazy imports para módulos pesados
// Não importar no top-level se só usado em alguns paths
async function runAgent(prompt: string) {
  const { CoioteAgent } = await import('./agent/agent');
  // ...
}

// ❌ Nunca importar tudo no entrypoint
import { CoioteAgent } from './agent/agent'; // Carrega SDK, SQLite, etc. imediatamente
```

### Context Window

```typescript
// Estratégia de prioridade para context loading
const contextStrategy = [
  { source: 'coiote.config.md',     priority: 1 },  // Sempre incluir
  { source: 'files-in-prompt',       priority: 2 },  // Arquivos mencionados
  { source: 'git-recent-changes',    priority: 3 },  // Últimas mudanças
  { source: 'project-structure',     priority: 4 },  // Estrutura de pastas
  { source: 'related-files',         priority: 5 },  // Arquivos relacionados
];

// Truncar arquivos grandes de forma inteligente
const MAX_FILE_TOKENS = 2_000;
const MAX_TOTAL_CONTEXT_TOKENS = 80_000;
```

### Streaming

Sempre usar streaming de respostas do LLM para mostrar saída em tempo real:

```typescript
// ✅ Streaming — usuário vê texto surgindo
for await (const chunk of provider.stream(params)) {
  reporter.streamChunk(chunk.text);
}

// ❌ Blocking — usuário espera resposta completa em silêncio
const response = await provider.complete(params);
```

---

## 11. Checklist de Code Review

Antes de abrir um PR, verifique:

**Código:**
- [ ] TypeScript sem erros (`pnpm tsc --noEmit`)
- [ ] Lint limpo (`pnpm lint`)
- [ ] Sem uso de `console.log` (usar `reporter`)
- [ ] Sem uso de `any` ou `@ts-ignore` sem justificativa
- [ ] Todas as Promises são `await`ed ou têm `.catch()`
- [ ] Operações I/O são async

**Tools (se aplicável):**
- [ ] Implementa interface `Tool<TInput, TOutput>` completa
- [ ] `requiresConfirmation` definido corretamente
- [ ] `isDestructive` definido corretamente
- [ ] Retorna `ToolResult` com `summary` legível
- [ ] Erros retornados como `Result`, não lançados
- [ ] Registrada no `ToolRegistry`

**Comunicação com usuário:**
- [ ] Não usa `console.log` — usa `reporter`
- [ ] Exibe preview antes de modificar arquivos
- [ ] Erros incluem contexto humano legível
- [ ] Operações longas têm indicador de progresso

**Testes:**
- [ ] Novos módulos têm testes unitários
- [ ] Cobertura >= 80% no módulo alterado
- [ ] Casos de erro testados, não apenas happy path

**Segurança:**
- [ ] Não loga nem persiste chaves de API
- [ ] Paths validados com `path.resolve` + verificação de escape
- [ ] Comandos shell não concatenam input do usuário/LLM diretamente

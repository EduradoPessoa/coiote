# 🐺 Coiote — Stack Tecnológica

> **Documento:** coiote-stack.md  
> **Versão:** 1.0  
> **Escopo:** Especificação completa de toda a stack do projeto

---

## Sumário

1. [Visão Geral da Stack](#1-visão-geral-da-stack)
2. [Runtime e Linguagem](#2-runtime-e-linguagem)
3. [Interface de Linha de Comando (TUI)](#3-interface-de-linha-de-comando-tui)
4. [Camada de Integração com LLMs](#4-camada-de-integração-com-llms)
5. [Ferramentas do Agente](#5-ferramentas-do-agente)
6. [Persistência e Estado](#6-persistência-e-estado)
7. [Build, Tooling e DX](#7-build-tooling-e-dx)
8. [Testes](#8-testes)
9. [Distribuição](#9-distribuição)
10. [Diagrama de Dependências](#10-diagrama-de-dependências)
11. [Decisões Arquiteturais (ADRs)](#11-decisões-arquiteturais-adrs)

---

## 1. Visão Geral da Stack

O Coiote é uma aplicação CLI Node.js escrita em TypeScript. A stack foi escolhida priorizando:

- **Ecossistema npm** — acesso nativo às melhores bibliotecas de terminal e LLM
- **TypeScript estrito** — segurança de tipos em todas as camadas, especialmente no tool loop
- **Zero dependências de servidor** — toda execução é local, sem backend
- **Composabilidade** — cada camada pode ser testada e substituída de forma independente

```
┌─────────────────────────────────────────────────────────────┐
│                     DISTRIBUIÇÃO                            │
│              npm package  |  npx coiote                     │
├─────────────────────────────────────────────────────────────┤
│                   INTERFACE (TUI)                           │
│         ink + React  |  chalk  |  cli-spinners              │
├─────────────────────────────────────────────────────────────┤
│                 ORQUESTRADOR DO AGENTE                      │
│      Agent Loop  |  Event Bus  |  Permission Manager        │
├──────────────────────────┬──────────────────────────────────┤
│     INTEGRAÇÃO LLM       │      FERRAMENTAS (TOOLS)         │
│  @anthropic-ai/sdk       │  fs-extra | execa | simple-git   │
│  openai sdk (compat.)    │  glob | ripgrep | diff           │
├──────────────────────────┴──────────────────────────────────┤
│                   PERSISTÊNCIA LOCAL                        │
│         SQLite (better-sqlite3)  |  fs (JSON/NDJSON)        │
├─────────────────────────────────────────────────────────────┤
│                  RUNTIME & LINGUAGEM                        │
│              Node.js 20 LTS  |  TypeScript 5.x              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Runtime e Linguagem

### Node.js

| Atributo | Valor |
|----------|-------|
| **Versão mínima** | 20.0.0 (LTS) |
| **Versão recomendada** | 22.x (Current LTS) |
| **Engine field no package.json** | `"node": ">=20.0.0"` |

**Por que Node.js 20+:**
- `fs/promises` com API madura e estável
- `AbortController` nativo para cancelamento de operações longas
- `fetch` nativo (sem dependência de `node-fetch`)
- Performance de startup adequada para CLI (<200ms)
- Suporte a ESM nativo

### TypeScript

| Atributo | Valor |
|----------|-------|
| **Versão** | 5.4+ |
| **Mode** | `strict: true` |
| **Target** | `ES2022` |
| **Module** | `NodeNext` |
| **moduleResolution** | `NodeNext` |

**tsconfig.json base:**
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Gerenciador de Pacotes

**pnpm** é o gerenciador padrão do projeto.

| Atributo | Valor |
|----------|-------|
| **Gerenciador** | pnpm 9+ |
| **Lockfile** | `pnpm-lock.yaml` (commitado) |
| **Node modules** | hoisted (compatibilidade com ink) |

```bash
# Instalar pnpm globalmente
npm install -g pnpm

# Instalar dependências
pnpm install

# Adicionar dependência
pnpm add <package>

# Adicionar dependência de desenvolvimento
pnpm add -D <package>
```

---

## 3. Interface de Linha de Comando (TUI)

### ink `^5.0.0`

Framework React para terminal. Escolha central da TUI do Coiote.

**Por que ink:**
- Componentes React reutilizáveis no terminal
- Gerencia rerenders eficientemente (sem flickering)
- Suporte a hooks, context, e estado reativo
- Permite compor UIs complexas (progress bars, tabelas, spinners) com familiaridade React

```typescript
import { Box, Text, useInput } from 'ink';

export const PlanDisplay: React.FC<{ plan: ExecutionPlan }> = ({ plan }) => (
  <Box flexDirection="column" borderStyle="single" borderColor="blue">
    <Text bold color="blue">📋 PLANO DE EXECUÇÃO</Text>
    {plan.steps.map((step, i) => (
      <Text key={i}>  {i + 1}. {step.description}</Text>
    ))}
  </Box>
);
```

### chalk `^5.0.0`

Cores e estilos de texto para saídas não-React (logs, erros, output de comandos).

```typescript
import chalk from 'chalk';

export const icons = {
  plan:     chalk.blue('📋'),
  action:   chalk.cyan('⚡'),
  tool:     chalk.yellow('🔧'),
  success:  chalk.green('✅'),
  warning:  chalk.yellow('⚠️'),
  error:    chalk.red('❌'),
  ask:      chalk.magenta('❓'),
  done:     chalk.greenBright('🎉'),
} as const;
```

### cli-spinners `^2.9.0` + ora `^8.0.0`

Spinners animados para operações longas.

```typescript
import ora from 'ora';

const spinner = ora({
  text: 'Coiote está pensando...',
  spinner: 'dots',
  color: 'cyan',
}).start();

// Atualizar
spinner.text = `Analisando codebase... (${count} arquivos)`;

// Finalizar
spinner.succeed('Análise concluída');
spinner.fail('Falhou ao ler arquivo');
```

### cli-width `^4.0.0`

Detecta a largura atual do terminal para adaptar a UI.

```typescript
import cliWidth from 'cli-width';
const width = cliWidth({ defaultWidth: 80 });
const divider = '━'.repeat(Math.min(width, 60));
```

### @inquirer/prompts `^7.0.0`

Prompts interativos modernos (substitui o legado `inquirer`).

```typescript
import { confirm, select, input } from '@inquirer/prompts';

// Confirmação simples
const proceed = await confirm({ message: 'Continuar?' });

// Seleção de opção
const strategy = await select({
  message: 'Como prosseguir?',
  choices: [
    { name: 'Tentar estratégia alternativa', value: 'retry' },
    { name: 'Me mostrar o arquivo', value: 'inspect' },
    { name: 'Abortar', value: 'abort' },
  ],
});
```

### diff `^7.0.0`

Geração de diffs legíveis para preview antes de escrita de arquivos.

```typescript
import { createPatch, diffLines } from 'diff';

const patch = createPatch(
  filename,
  originalContent,
  newContent,
  'original',
  'modificado'
);
```

---

## 4. Camada de Integração com LLMs

### @anthropic-ai/sdk `^0.30.0`

SDK oficial do Claude. Provider padrão do Coiote.

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const stream = await client.messages.stream({
  model: 'claude-sonnet-4-5',
  max_tokens: 8192,
  tools: coioteTools,
  messages: conversationHistory,
  system: systemPrompt,
});

// Streaming com tool use
for await (const event of stream) {
  if (event.type === 'content_block_delta') {
    // Atualizar UI com texto em streaming
  }
  if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
    // Processar chamada de ferramenta
  }
}
```

**Modelos suportados:**

| Modelo | Uso recomendado | Contexto |
|--------|----------------|----------|
| `claude-sonnet-4-5` | Padrão — velocidade + qualidade | 200k tokens |
| `claude-opus-4-5` | Tarefas complexas, refatorações grandes | 200k tokens |
| `claude-haiku-4-5` | Tarefas simples, context compaction | 200k tokens |

### Abstração Multi-Provider

Interface unificada que permite trocar de provider sem alterar o restante do código:

```typescript
// src/providers/types.ts
export interface LLMProvider {
  name: string;
  chat(params: ChatParams): Promise<ChatResponse>;
  stream(params: ChatParams): AsyncIterable<StreamEvent>;
  supportsToolUse: boolean;
}

// src/providers/anthropic.ts
export class AnthropicProvider implements LLMProvider { ... }

// src/providers/openai.ts (compatível com Gemini, DeepSeek, etc.)
export class OpenAICompatProvider implements LLMProvider { ... }

// src/providers/ollama.ts
export class OllamaProvider implements LLMProvider { ... }
```

**Providers planejados:**

| Provider | Pacote | Status |
|----------|--------|--------|
| Anthropic Claude | `@anthropic-ai/sdk` | ✅ Fase 1 |
| OpenAI / Azure | `openai` | 📅 Fase 3 |
| Google Gemini | `@google/generative-ai` | 📅 Fase 3 |
| Ollama (local) | `ollama` | 📅 Fase 3 |

---

## 5. Ferramentas do Agente

### fs-extra `^11.0.0`

Extensão do `fs` nativo com métodos adicionais e Promises.

```typescript
import fs from 'fs-extra';

await fs.readFile(path, 'utf-8');
await fs.outputFile(path, content);   // Cria diretórios intermediários
await fs.pathExists(path);            // Não lança exceção se não existir
await fs.copy(src, dest);
```

### execa `^9.0.0`

Execução de comandos shell com controle total de streams.

```typescript
import { execa, execaCommand } from 'execa';

// Com streaming de stdout em tempo real
const proc = execa('npm', ['install', packageName]);
proc.stdout?.pipe(process.stdout);  // Output em tempo real
await proc;

// Com AbortController para cancelamento
const controller = new AbortController();
const proc = execa('npm', ['run', 'build'], {
  cancelSignal: controller.signal,
  timeout: 120_000,  // 2 minutos
});
```

### simple-git `^3.0.0`

Integração programática com Git.

```typescript
import simpleGit from 'simple-git';

const git = simpleGit(projectRoot);

await git.status();
await git.diff(['--stat']);
await git.add('.');
await git.commit('feat(auth): add JWT middleware');
await git.checkoutLocalBranch('feat/jwt-auth');
```

### glob `^11.0.0`

Busca de arquivos por padrão glob.

```typescript
import { glob } from 'glob';

const tsFiles = await glob('src/**/*.ts', {
  ignore: ['node_modules/**', 'dist/**'],
  cwd: projectRoot,
});
```

### @fast-glob/tinyglobby `^0.2.0`

Alternativa mais rápida ao `glob` para scan inicial de codebases grandes.

### ripgrep (binário via `@vscode/ripgrep`)

Busca de texto em arquivos com desempenho superior ao `grep`.

```typescript
import { rgPath } from '@vscode/ripgrep';
import { execa } from 'execa';

const { stdout } = await execa(rgPath, [
  '--json',
  '--type', 'ts',
  searchQuery,
  projectRoot,
]);
```

---

## 6. Persistência e Estado

### better-sqlite3 `^9.0.0`

Banco SQLite local para histórico de sessões e cache.

**Por que SQLite:**
- Zero configuração, arquivo único
- Queries síncronas (simplifica o código do CLI)
- Robusto o suficiente para dados locais de sessão
- Portável entre sistemas operacionais

```typescript
import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

const dbPath = path.join(os.homedir(), '.coiote', 'coiote.db');
const db = new Database(dbPath);

// Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    project_path TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    last_active INTEGER NOT NULL,
    model TEXT NOT NULL,
    total_tokens INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    tokens INTEGER,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
  );
`);
```

### conf `^13.0.0`

Configurações globais do usuário (chaves de API, preferências).

```typescript
import Conf from 'conf';

const config = new Conf({
  projectName: 'coiote',
  schema: {
    defaultModel: { type: 'string', default: 'claude-sonnet-4-5' },
    defaultProvider: { type: 'string', default: 'anthropic' },
    autoCommit: { type: 'boolean', default: false },
    verbosity: { type: 'string', enum: ['quiet', 'normal', 'verbose'], default: 'normal' },
  },
});

config.set('defaultModel', 'claude-opus-4-5');
const model = config.get('defaultModel');
```

**Localização dos dados:**

| Sistema | Caminho |
|---------|---------|
| Linux | `~/.config/coiote/` |
| macOS | `~/Library/Preferences/coiote/` |
| Windows | `%APPDATA%\coiote\` |

---

## 7. Build, Tooling e DX

### tsup `^8.0.0`

Bundler para TypeScript baseado em esbuild. Gera o binário de distribuição.

```typescript
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,            // CLIs não precisam de minificação
  shims: true,              // __dirname, __filename para ESM
  banner: {
    js: '#!/usr/bin/env node', // Shebang para execução direta
  },
});
```

### eslint `^9.0.0` + typescript-eslint `^8.0.0`

Linting com regras específicas para Node.js CLI.

```javascript
// eslint.config.mjs
import tseslint from 'typescript-eslint';

export default tseslint.config(
  tseslint.configs.strictTypeChecked,
  {
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      'no-console': 'warn',  // Usar o Reporter, não console.log
    },
  }
);
```

### prettier `^3.0.0`

Formatação consistente de código.

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100,
  "trailingComma": "es5"
}
```

### husky `^9.0.0` + lint-staged `^15.0.0`

Git hooks para garantir qualidade antes de cada commit.

```json
// package.json
{
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

---

## 8. Testes

### vitest `^2.0.0`

Framework de testes unitários e de integração.

```typescript
// Teste de unidade de uma tool
import { describe, it, expect, vi } from 'vitest';
import { readFileTool } from '../src/tools/filesystem';

describe('readFileTool', () => {
  it('deve retornar conteúdo do arquivo', async () => {
    const result = await readFileTool.execute({ path: './fixtures/sample.ts' });
    expect(result.success).toBe(true);
    expect(result.content).toContain('export');
  });

  it('deve retornar erro legível quando arquivo não existe', async () => {
    const result = await readFileTool.execute({ path: './nao-existe.ts' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('não encontrado');
  });
});
```

### @vitest/coverage-v8

Cobertura de código integrada ao vitest.

| Mínimo exigido | Caminho |
|----------------|---------|
| 80% | `src/tools/` |
| 70% | `src/agent/` |
| 60% | `src/ui/` |

### nock `^13.0.0`

Mock de requisições HTTP para testes da camada LLM sem consumir API real.

```typescript
import nock from 'nock';

nock('https://api.anthropic.com')
  .post('/v1/messages')
  .reply(200, mockAnthropicResponse);
```

---

## 9. Distribuição

### commander `^12.0.0`

Parser de argumentos CLI.

```typescript
import { program } from 'commander';

program
  .name('coiote')
  .description('Assistente de desenvolvimento guiado por IA')
  .version(pkg.version)
  .argument('[prompt]', 'Tarefa a executar')
  .option('-m, --model <model>', 'Modelo LLM a usar', 'claude-sonnet-4-5')
  .option('-v, --verbose', 'Saída detalhada')
  .option('-q, --quiet', 'Apenas erros e resumo final')
  .option('-y, --auto', 'Confirmar todas as ações automaticamente')
  .option('--no-git', 'Desabilitar integração git')
  .parse();
```

### update-notifier `^7.0.0`

Notifica o usuário quando há nova versão disponível.

```typescript
import updateNotifier from 'update-notifier';
import pkg from '../package.json' assert { type: 'json' };

updateNotifier({ pkg }).notify();
```

### pkg.json `bin` field

```json
{
  "name": "coiote",
  "bin": {
    "coiote": "./dist/index.js"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

---

## 10. Diagrama de Dependências

```
coiote (CLI entry)
├── commander              — parsing de args
├── update-notifier        — notificação de atualizações
│
├── [TUI Layer]
│   ├── ink                — React no terminal
│   ├── chalk              — cores e estilos
│   ├── ora                — spinners
│   ├── @inquirer/prompts  — prompts interativos
│   ├── diff               — geração de diffs
│   └── cli-width          — largura do terminal
│
├── [Agent Layer]
│   ├── @anthropic-ai/sdk  — LLM provider padrão
│   └── openai             — LLM provider alternativo
│
├── [Tools Layer]
│   ├── fs-extra           — operações de arquivo
│   ├── execa              — execução de shell
│   ├── simple-git         — integração git
│   ├── glob               — busca de arquivos
│   └── @vscode/ripgrep    — busca de texto
│
└── [Persistence Layer]
    ├── better-sqlite3     — histórico de sessões
    └── conf               — configurações do usuário

[Dev Dependencies]
├── typescript             — compilador
├── tsup                   — bundler
├── vitest                 — testes
├── eslint                 — linting
├── prettier               — formatação
└── husky + lint-staged    — git hooks
```

---

## 11. Decisões Arquiteturais (ADRs)

### ADR-001: TypeScript ESM Nativo

**Decisão:** Usar `"module": "NodeNext"` com ESM puro, sem CommonJS.  
**Motivo:** `ink`, `chalk`, `ora` e outras dependências-chave são ESM-only nas versões atuais.  
**Consequência:** `require()` não pode ser usado; todos os imports são `import`.

### ADR-002: SQLite sobre JSON files

**Decisão:** `better-sqlite3` para histórico de sessões, não arquivos JSON.  
**Motivo:** Queries são mais simples; performance com histórico longo é superior; transações garantem integridade.  
**Consequência:** Adiciona um arquivo de binário nativo como dependência.

### ADR-003: ink sobre alternativas (blessed, terminal-kit)

**Decisão:** `ink` como framework TUI.  
**Motivo:** API React é conhecida pelo time; rerenders eficientes sem flickering; testável com `@ink-testing-library`.  
**Consequência:** React como dependência, startup ~30ms mais lento que TUIs imperativas.

### ADR-004: execa sobre child_process nativo

**Decisão:** `execa` para todos os comandos shell.  
**Motivo:** Melhor ergonomia com Promises; suporte nativo a `AbortController`; streams mais simples; output cross-platform.  
**Consequência:** Dependência adicional.

### ADR-005: Abstração de Provider LLM desde o início

**Decisão:** Interface `LLMProvider` desde a Fase 1, mesmo usando apenas Anthropic.  
**Motivo:** Evitar acoplamento que exija refatoração grande quando outros providers forem adicionados na Fase 3.  
**Consequência:** Leve overhead inicial de abstração.

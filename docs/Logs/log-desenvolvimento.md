# 🐺 Coiote — Log de Desenvolvimento

---

## 2026-02-28 — Semana 1, Fase 1: Fundação do Projeto

**Data e hora:** 2026-02-28T22:01:31-03:00

### Prompt Recebido

> Você é um engenheiro sênior TypeScript iniciando o desenvolvimento do projeto Coiote.
>
> Leia os seguintes documentos antes de qualquer ação:
> - docs/coiote-prd.md — visão, filosofia e sistema de comunicação
> - docs/coiote-stack.md — stack completa e decisões arquiteturais
> - docs/coiote-development.md — estrutura de pastas, padrões de código, boas práticas
> - docs/coiote-orchestrator.md — plano de execução por fases
>
> Sua tarefa é executar a Semana 1 da Fase 1 do orchestrator:
> - Criar a estrutura de pastas completa do projeto conforme coiote-development.md §1
> - Configurar package.json com as definições corretas (type: module, engines, bin)
> - Configurar tsconfig.json com strict mode conforme coiote-stack.md §2
> - Configurar tsup.config.ts com shebang
> - Configurar eslint, prettier, husky e lint-staged
> - Configurar vitest.config.ts com coverage v8
> - Criar src/index.ts e src/cli.ts com entrypoint mínimo funcionando
> - Criar src/errors.ts com a hierarquia de erros base
>
> Critério de conclusão: `pnpm build && node dist/index.js --version` funciona.

---

### Resposta Final — O que foi feito

#### ✅ Critério de conclusão atingido

```
> pnpm build
ESM ⚡️ Build success in 24ms

> node dist/index.js --version
0.1.0

> node dist/index.js --help
Usage: coiote [options] [prompt]
Assistente de desenvolvimento guiado por IA em linha de comando
...

> pnpm typecheck
✅ Zero erros
```

#### Arquivos criados/modificados

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `package.json` | Configuração | `type: "module"`, `engines: >=20`, `bin: { coiote: "./dist/index.js" }`, scripts, lint-staged |
| `tsconfig.json` | Configuração | `strict: true`, `target: ES2022`, `module: NodeNext`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` |
| `tsup.config.ts` | Build | ESM, `target: node20`, shebang `#!/usr/bin/env node`, sourcemap, sem minificação |
| `eslint.config.mjs` | Linting | `typescript-eslint` strict type-checked, `no-floating-promises`, `no-console: warn` |
| `.prettierrc` | Formatação | `semi: true`, `singleQuote: true`, `tabWidth: 2`, `printWidth: 100` |
| `vitest.config.ts` | Testes | Coverage v8, thresholds 60%, reporters text+html+lcov |
| `.gitignore` | Git | node_modules, dist, coverage, env files |
| `.husky/pre-commit` | Git hooks | Executa `lint-staged` antes de cada commit |
| `src/index.ts` | Entrypoint | Verifica Node.js >=20, lazy import do CLI |
| `src/cli.ts` | CLI | Commander com `--version`, `--help`, `--verbose`, `--quiet`, `--auto`, `--model`, `--no-git` |
| `src/errors.ts` | Erros | `CoioteError` (base), `ToolExecutionError`, `PermissionDeniedError`, `ProviderError`, `ConfigurationError`, `ContextOverflowError` |
| `src/tools/types.ts` | Types | Interface `ToolResult` placeholder |

#### Estrutura de pastas criada

```
src/
├── agent/
├── providers/
├── tools/
│   ├── filesystem/
│   ├── shell/
│   └── git/
├── ui/
│   └── components/
├── permissions/
├── persistence/
├── config/
└── utils/
test/
├── unit/
├── integration/
└── fixtures/
    └── express-api/
```

#### Dependências instaladas

**Produção:**
- `commander@14.0.3`

**Desenvolvimento:**
- `typescript`, `tsup`, `vitest`, `@vitest/coverage-v8`
- `eslint`, `typescript-eslint`, `prettier`
- `husky`, `lint-staged`
- `@types/node`

#### Decisões tomadas

1. **Shebang apenas no banner do tsup** — Não incluir `#!/usr/bin/env node` no source `src/index.ts` para evitar duplicação no output (causa SyntaxError no ESM).
2. **DTS desabilitado no tsup** — CLIs não precisam de declarações de tipo. O typecheck é feito separadamente com `tsc --noEmit`.
3. **`name` em erros sem `override readonly`** — `exactOptionalPropertyTypes: true` no tsconfig causa conflito com literal types em subclasses. Resolvido com `this.name = '...'` no constructor.
4. **Thresholds de coverage em 60%** — Valor inicial conservador; será aumentado conforme mais código e testes forem adicionados nas próximas semanas.

---

## 2026-03-01 — Semana 7, Fase 2: Mais Tools + Histórico

**Data e hora:** 2026-03-01T23:35:00-03:00

### Prompt Recebido

> Leia coiote.config.md e docs/coiote-orchestrator.md.
> Vamos desenvolver a semana 7, iniciando a fase 2
> 
> Crie um documento chamado log-desenvolvimento.md na pasta /DOCS/Logs/ e ne registre data e hora, Prompt passado para você aqui, e sua resposta final.

### O que foi Feito

| Componente | Mudança | Detalhes Técnicos |
|------------|---------|----------|
| **FS Tools Expandidas** | `edit_file`, `delete_file`, `search_files` | Implementadas ferramentas de edição precisa (search/replace), deleção com confirmação de alto risco e busca recursiva (fallback robusto na ausência de ripgrep). |
| **Shell Tools Novas** | `run_tests`, `install_package` | Automação para execução de suites de testes e instalação de dependências via npm/pnpm diretamente pelo agente. |
| **Persistência de Erros e Logs** | Tabela `tool_calls` | Criada infraestrutura no SQLite para gravar cada chamada de ferramenta, incluindo parâmetros de entrada, saída, duração e sucesso. Isso permite auditoria completa. |
| **Gestão de Histórico (CLI)** | Comando `coiote history` | Adicionado comando `history list` para ver sessões passadas e `history show <id>` para inspecionar o log de ferramentas de uma sessão específica. |

### Cheques efetuados!

✔️ `pnpm typecheck` aprovado em todo o workspace.
✔️ Schema do SQLite migrado automaticamente para incluir `tool_calls`.
✔️ Registro de ferramentas no CLI validado.

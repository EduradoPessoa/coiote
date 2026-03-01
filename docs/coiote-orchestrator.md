# 🐺 Coiote — Orquestrador de Desenvolvimento

> **Documento:** coiote-orchestrator.md  
> **Versão:** 1.0  
> **Escopo:** Plano detalhado de execução do projeto, dividido em fases, com referências cruzadas à documentação

---

## Sumário

1. [Visão do Orquestrador](#1-visão-do-orquestrador)
2. [Mapa de Dependências entre Fases](#2-mapa-de-dependências-entre-fases)
3. [Fase 1 — MVP Funcional](#3-fase-1--mvp-funcional-semanas-14)
4. [Fase 2 — Context Awareness](#4-fase-2--context-awareness-semanas-58)
5. [Fase 3 — Agência Completa](#5-fase-3--agência-completa-semanas-914)
6. [Fase 4 — Polimento e Distribuição](#6-fase-4--polimento-e-distribuição-semanas-1520)
7. [Critérios de Entrada e Saída por Fase](#7-critérios-de-entrada-e-saída-por-fase)
8. [Gestão de Riscos](#8-gestão-de-riscos)
9. [Métricas de Progresso](#9-métricas-de-progresso)

---

## 1. Visão do Orquestrador

Este documento é o **mapa mestre** do desenvolvimento do Coiote. Ele integra todas as demais especificações e define:

- O que construir em cada fase
- Em que ordem construir
- Quais documentos de referência consultar para cada entregável
- Critérios objetivos para avançar de fase

### Documentos de Referência

| Documento | Papel no Projeto |
|-----------|-----------------|
| `COIOTE_DOCUMENTACAO.md` | PRD — visão geral, filosofia, UX de comunicação |
| `coiote-stack.md` | Stack tecnológica completa e decisões arquiteturais |
| `coiote-development.md` | Padrões de código, estrutura de módulos, boas práticas |
| `coiote-data.md` | Schema de dados, persistência, ciclo de vida |
| `coiote-security.md` | Modelo de ameaças, controles de segurança |
| **`coiote-orchestrator.md`** | ← Você está aqui — plano de execução |

---

## 2. Mapa de Dependências entre Fases

```
FASE 1 — MVP (Semanas 1–4)
│ Foundation: Runtime, estrutura, CLI, 1 provider, tools básicas, UX mínima
│
│ Entregável: `coiote "faça X"` funciona com read/write/shell + comunicação clara
│
└── FASE 2 — Context Awareness (Semanas 5–8)
    │ Sobre a Fase 1: adiciona git, config de projeto, histórico, context loading
    │
    │ Entregável: Coiote entende o projeto sem precisar de instruções manuais
    │
    └── FASE 3 — Agência Completa (Semanas 9–14)
        │ Sobre a Fase 2: multi-provider, loop robusto, MCP, CI/CD
        │
        │ Entregável: Coiote pode ser usado como ferramenta de produção
        │
        └── FASE 4 — Polimento e Distribuição (Semanas 15–20)
            │ Sobre a Fase 3: TUI rica, syntax highlighting, npm publish
            │
            └── Entregável: v1.0 pública, instalável com `npx coiote`
```

---

## 3. Fase 1 — MVP Funcional (Semanas 1–4)

### Objetivo

Ter um CLI funcional onde o usuário pode executar uma tarefa simples e o Coiote a executa com comunicação clara e segura.

**Definição de Pronto:** `coiote "crie um arquivo README.md para este projeto"` funciona do início ao fim.

---

### Semana 1 — Fundação do Projeto

**Foco:** Estrutura, tooling e entrypoint CLI

**Referências:** `coiote-stack.md §2` (Runtime), `coiote-development.md §1` (Estrutura do Projeto)

#### Tarefas

**Setup do Projeto**
```bash
# Estrutura inicial
pnpm init
pnpm add -D typescript tsup vitest eslint prettier husky lint-staged
npx tsc --init  # + configurar com as opções de coiote-stack.md §2
```

- [ ] Criar `package.json` com `"type": "module"`, engines, bin field
- [ ] Configurar `tsconfig.json` com strict mode completo (ver `coiote-stack.md §2`)
- [ ] Configurar `tsup.config.ts` com shebang `#!/usr/bin/env node`
- [ ] Configurar `eslint.config.mjs` com typescript-eslint strict
- [ ] Configurar `prettier` + `husky` + `lint-staged`
- [ ] Configurar `vitest.config.ts` com coverage v8

**Entrypoint CLI**
- [ ] `src/index.ts` — boot mínimo com verificação de Node.js version
- [ ] `src/cli.ts` — `commander` com estrutura base de comandos
- [ ] Comando `coiote --version` funcionando
- [ ] Comando `coiote --help` com descrição clara

**Estrutura de Pastas**
- [ ] Criar estrutura completa de `src/` conforme `coiote-development.md §1`
- [ ] Criar `test/` com `fixtures/express-api/` (projeto de teste)
- [ ] `src/errors.ts` — hierarquia de erros base (`coiote-development.md §7`)

**Critério da Semana:** `pnpm build && node dist/index.js --version` funciona

---

### Semana 2 — Provider LLM + Tools Base

**Foco:** Integração com Anthropic e primeiras tools funcionais

**Referências:** `coiote-stack.md §4` (LLM), `coiote-development.md §4` (Tools), `coiote-security.md §2` (Chaves)

#### Tarefas

**Gestão de Chaves de API**
- [ ] `src/config/key-manager.ts` — KeyManager com keytar + fallback (`coiote-security.md §2`)
- [ ] Comando `coiote config set-key anthropic` — configuração inicial da chave
- [ ] Comando `coiote config show` — exibir configuração sem expor chaves
- [ ] Validação de formato de chave antes de armazenar

**Provider Anthropic**
- [ ] `src/providers/types.ts` — interface `LLMProvider` completa
- [ ] `src/providers/anthropic.ts` — implementação com streaming
- [ ] `src/providers/factory.ts` — factory pattern para instanciar
- [ ] Teste de integração mockado com `nock`

**Tools do Agente — Lote 1**

> Para cada tool: implementar interface, teste unitário, registro

- [ ] `tools/filesystem/read-file.ts` — sem confirmação, com path validation
- [ ] `tools/filesystem/write-file.ts` — com diff preview e confirmação
- [ ] `tools/filesystem/list-files.ts` — glob com filtro de sensíveis
- [ ] `tools/shell/run-command.ts` — com validação, timeout, confirmação
- [ ] `tools/registry.ts` — `ToolRegistry` com conversão para formato Anthropic

**Segurança nas Tools**
- [ ] `src/security/path-validator.ts` — path traversal prevention (`coiote-security.md §4`)
- [ ] `src/security/command-validator.ts` — blocklist e patterns (`coiote-security.md §3`)

**Critério da Semana:** `readFileTool.execute()` e `writeFileTool.execute()` passam nos testes unitários

---

### Semana 3 — Sistema de Comunicação (O Diferencial)

**Foco:** Implementar o Reporter e toda a UX de comunicação descrita no PRD

**Referências:** `COIOTE_DOCUMENTACAO.md §4` (Sistema de Comunicação), `coiote-development.md §5` (Reporter)

#### Tarefas

**Reporter e Event Bus**
- [ ] `src/ui/reporter.ts` — EventEmitter tipado com todos os eventos (`coiote-development.md §2`)
- [ ] Tipos: `CoioteEvent` com todas as variantes (plan, step, tool, error, warning, done)
- [ ] Método `reporter.verbose()` controlado pela flag `--verbose`
- [ ] Método `reporter.quiet()` — apenas erros + done

**Componentes de Comunicação (baseados no PRD §4.4)**
- [ ] `src/ui/components/PlanDisplay.tsx` — bloco PLANO com passos e arquivos
- [ ] `src/ui/components/StepProgress.tsx` — "EXECUTANDO PASSO 3/7" com spinner
- [ ] `src/ui/components/ToolCallDisplay.tsx` — "🔧 Lendo arquivo: X → Y linhas"
- [ ] `src/ui/components/DiffPreview.tsx` — preview de arquivo antes de escrever
- [ ] `src/ui/components/ErrorDisplay.tsx` — erro com contexto humano + opções (`PRD §4.4 Erros`)
- [ ] `src/ui/components/DoneDisplay.tsx` — resumo final completo (`PRD §4.4 Conclusão`)
- [ ] `src/ui/components/WarningDisplay.tsx` — warnings proativos

**Prompts Interativos**
- [ ] `src/ui/prompts.ts` — wrappers de `@inquirer/prompts`
- [ ] `promptConfirm()` — [S/n] padrão
- [ ] `promptHighRisk()` — digitação de texto para ações irreversíveis (`PRD §4.7`)
- [ ] `promptSelectRecovery()` — opções de recuperação pós-erro
- [ ] `promptSessionMode()` — nível de autonomia no início da sessão

**Sistema de Permissões**
- [ ] `src/permissions/permission-manager.ts` — lógica central
- [ ] `src/permissions/session-config.ts` — nível ask-all / ask-destructive / auto
- [ ] `src/permissions/rules.ts` — ações que SEMPRE requerem confirmação (ver `PRD §6`)

**Critério da Semana:** Exibição visual completa de plano + execução + erro + resumo, testável com `@ink-testing-library`

---

### Semana 4 — Loop Agêntico + Integração E2E

**Foco:** Juntar todas as peças no loop agêntico funcional

**Referências:** `coiote-development.md §6` (Loop Agêntico), `coiote-data.md §3` (SQLite), `coiote-security.md §6` (Prompt Injection)

#### Tarefas

**Loop Agêntico**
- [ ] `src/agent/agent.ts` — `CoioteAgent` com loop completo (`coiote-development.md §6`)
- [ ] Loop guards: MAX_ITERATIONS=50, MAX_TOKENS=180k, timeout 10min
- [ ] Tratamento de erros do loop com opções de recuperação
- [ ] `AbortController` integrado para Ctrl+C limpo

**Planner**
- [ ] `src/agent/planner.ts` — prompt de planejamento → `ExecutionPlan` estruturado
- [ ] Extração de arquivos mencionados no plano para exibição

**System Prompt**
- [ ] `SYSTEM_PROMPT` base com identidade do Coiote
- [ ] Instruções anti-injection (`coiote-security.md §6`)
- [ ] Instruções de comunicação estruturada (como usar as tools)

**Persistência Básica**
- [ ] `src/persistence/db.ts` — singleton SQLite com auto-migrations (`coiote-data.md §3`)
- [ ] `src/persistence/sessions.ts` — criar/atualizar sessões
- [ ] `src/persistence/messages.ts` — persistir histórico ao final da task

**Configuração Global**
- [ ] `src/config/global-config.ts` — `conf` com schema completo (`coiote-data.md §4`)
- [ ] `coiote config` — subcomandos básicos (set, get, show)

**Teste E2E do MVP**
- [ ] `test/integration/mvp-basic.test.ts` com `MockProvider`
- [ ] Cenário: criar arquivo README → deve exibir plano, pedir confirmação, criar arquivo, exibir resumo
- [ ] Cenário: erro de tool → deve exibir erro com contexto + opções

**Critério da Fase 1:**
- `coiote "crie um README.md para este projeto"` executa do início ao fim
- Plano exibido antes da execução
- Diff exibido antes de criar o arquivo
- Confirmação solicitada
- Resumo final com arquivo criado e tempo de execução
- Cobertura de testes ≥ 70%

---

## 4. Fase 2 — Context Awareness (Semanas 5–8)

### Objetivo

O Coiote entende o projeto em que está trabalhando sem precisar de instruções manuais a cada sessão.

**Definição de Pronto:** `coiote "adicione um endpoint GET /health"` em um projeto Express funciona sem o usuário explicar a estrutura do projeto.

---

### Semana 5 — Configuração de Projeto + Git

**Referências:** `coiote-data.md §5` (Config de Projeto), `coiote-stack.md §5` (Git tool)

- [ ] `src/config/project-config.ts` — parser de `coiote.config.md`
  - Detecta e lê automaticamente na raiz do projeto
  - Parse de seções: contexto, comandos, convenções, permissões
  - Fallback para padrões quando arquivo não existe
- [ ] `coiote init` — cria `coiote.config.md` interativamente
- [ ] Git tools:
  - [ ] `tools/git/git-status.ts`
  - [ ] `tools/git/git-diff.ts`
  - [ ] `tools/git/git-commit.ts` — com confirmação e geração de mensagem
  - [ ] `tools/git/git-branch.ts`
- [ ] Auto-commit configurável pós-tarefa (`coiote.config.md`)

---

### Semana 6 — Context Loading Inteligente

**Referências:** `coiote-data.md §7` (Contexto Runtime), `coiote-security.md §7` (Dados Sensíveis)

- [ ] `src/agent/context-manager.ts` — estratégia de carregamento por prioridade
  - Prioridade 1: arquivos mencionados no prompt
  - Prioridade 2: `coiote.config.md`
  - Prioridade 3: mudanças git recentes
  - Prioridade 4: estrutura do projeto (tree)
  - Prioridade 5: arquivos relacionados (imports)
- [ ] Truncamento inteligente de arquivos grandes (resumo de estrutura para >200 linhas)
- [ ] `src/security/content-sanitizer.ts` — mascarar segredos antes de enviar (`coiote-security.md §7`)
- [ ] `src/security/injection-detector.ts` — scan de arquivos antes de incluir no contexto

---

### Semana 7 — Mais Tools + Histórico

**Referências:** `coiote-development.md §4` (Tools), `coiote-data.md §3` (SQLite)

- [ ] `tools/filesystem/edit-file.ts` — edição pontual com diff preciso (não sobrescrever arquivo inteiro)
- [ ] `tools/filesystem/delete-file.ts` — confirmação reforçada (irreversível)
- [ ] `tools/filesystem/search-files.ts` — ripgrep integration
- [ ] `tools/shell/run-tests.ts` — execução de suite de testes com parsing de output
- [ ] `tools/shell/install-package.ts` — npm/pip com confirmação e verificação de conflitos
- [ ] `src/persistence/tool-calls.ts` — log completo de tool calls (`coiote-data.md §3`)
- [ ] Comando `coiote history` — listar sessões recentes
- [ ] Comando `coiote history show <id>` — ver detalhes de sessão

---

### Semana 8 — Context Compaction + Verbosity

**Referências:** `coiote-development.md §6` (Loop), `coiote-data.md §7`

- [ ] `src/agent/compactor.ts` — compactação de histórico quando > 100k tokens
  - Usa `claude-haiku` para gerar resumo compacto
  - Exibe aviso ao usuário antes de compactar
  - Marca mensagens como `is_compacted=1` no SQLite
- [ ] Modo `--verbose`: exibir raciocínio do LLM, tokens usados por step, tempo de cada tool
- [ ] Modo `--quiet`: apenas erros críticos e resumo final
- [ ] Dashboard de tokens no resumo: input/output/cache/custo estimado
- [ ] `coiote data stats` — espaço usado, sessões armazenadas, tokens totais

**Critério da Fase 2:**
- `coiote "adicione endpoint GET /health"` funciona em projeto Express sem instrução manual
- Coiote lê `coiote.config.md` e adapta comportamento
- Git commit automático (quando configurado) com mensagem gerada
- Histórico navegável com `coiote history`
- Cobertura de testes ≥ 75%

---

## 5. Fase 3 — Agência Completa (Semanas 9–14)

### Objetivo

O Coiote pode ser usado como ferramenta de produção por times. Funciona em CI/CD, suporta múltiplos LLMs e é extensível via MCP.

---

### Semanas 9–10 — Multi-Provider + Robustez do Loop

**Referências:** `coiote-stack.md §4` (Providers), `coiote-security.md §3` (Shell)

- [ ] `src/providers/openai.ts` — provider OpenAI-compatible (funciona com Gemini, DeepSeek)
- [ ] `src/providers/ollama.ts` — provider para modelos locais
- [ ] `coiote config set-provider` — troca de provider
- [ ] Retry automático com backoff exponencial para erros de API transitórios
- [ ] Detecção de loop infinito mais sofisticada (detectar repetição de tool calls)
- [ ] Recuperação automática de erros comuns (arquivo não encontrado → perguntar path correto)
- [ ] Rate limiter de tokens e requests por sessão (`coiote-security.md §5`)

---

### Semanas 11–12 — Slash Commands + Modo Headless

**Referências:** `COIOTE_DOCUMENTACAO.md §4` (Comunicação)

- [ ] Sistema de slash commands no REPL:
  - `/plan` — exibir plano da tarefa atual
  - `/explain` — explicar o que foi feito até agora
  - `/undo` — reverter última ação (via git)
  - `/commit` — forçar commit do estado atual
  - `/test` — rodar suite de testes do projeto
  - `/status` — resumo rápido: tokens, arquivos modificados, tempo
- [ ] Modo headless `coiote --headless "prompt"`:
  - Sem prompts interativos — falha se precisar de confirmação não-configurada
  - Output em JSON estruturado para parsing por CI
  - Exit codes semânticos (0=sucesso, 1=erro, 2=permissão negada)
- [ ] `coiote run --file tasks.md` — executar lista de tarefas de um arquivo

---

### Semanas 13–14 — MCP + Auditoria

**Referências:** `coiote-security.md §8` (Auditoria), `coiote-security.md §9` (Dependências)

- [ ] Suporte a MCP servers:
  - `coiote mcp add <server-url>` — registrar MCP server
  - `coiote mcp list` — listar servers configurados
  - Cada MCP server requer confirmação de uso na primeira vez
  - Isolamento: MCP servers não têm acesso ao filesystem do Coiote
- [ ] `src/audit/audit-log.ts` — log append-only de ações críticas (`coiote-security.md §8`)
- [ ] Verificação de integridade de binários externos (`coiote-security.md §9`)
- [ ] `pnpm audit` no CI com falha em vulnerabilidades high
- [ ] `coiote data cleanup` — limpeza automática configurável

**Critério da Fase 3:**
- Funciona com Claude, GPT-4 e modelos Ollama locais
- Modo headless usável em CI/CD com exit codes corretos
- Slash commands funcionando no REPL
- Pelo menos 1 MCP server de exemplo integrado (ex: filesystem extendido)
- Cobertura de testes ≥ 80%
- Zero vulnerabilidades `high` nas dependências

---

## 6. Fase 4 — Polimento e Distribuição (Semanas 15–20)

### Objetivo

Versão 1.0 pública, instalável via `npx coiote`, com documentação completa e TUI de alta qualidade.

---

### Semanas 15–16 — TUI Rica + Syntax Highlighting

**Referências:** `coiote-stack.md §3` (TUI)

- [ ] Redesign completo da TUI com `ink` — componentes coesos e visualmente consistentes
- [ ] Syntax highlighting no terminal para preview de código (via `highlight.js` ou `shiki`)
- [ ] Animações de transição entre fases do loop agêntico
- [ ] Modo compacto: output mais denso para terminais pequenos
- [ ] Temas: auto (detectar tema do terminal), light, dark

---

### Semanas 17–18 — Plugin System + Customização

- [ ] `src/plugins/` — sistema de plugins para tools customizadas
  - `coiote plugin add ./my-plugin.ts`
  - Interface: mesma `Tool<TInput, TOutput>` das tools nativas
- [ ] Perfis de uso: `coiote profile create backend` — config específica por contexto
- [ ] Template de `coiote.config.md` por tipo de projeto (Node.js, Python, Rust)
- [ ] Dashboard de uso e custo acumulado: `coiote stats --period month`

---

### Semanas 19–20 — Documentação + Publicação

**Referências:** `coiote-security.md §9` (Distribuição segura)

- [ ] `README.md` público com quickstart, exemplos, GIFs animados
- [ ] Documentação de referência em `/docs` (ou site)
- [ ] `CONTRIBUTING.md` — guia para contribuidores
- [ ] `SECURITY.md` — política de disclosure responsável
- [ ] SBOM (Software Bill of Materials) gerado no build
- [ ] Assinatura de releases com GPG
- [ ] `npm publish` com provenance attestation
- [ ] GitHub Releases com changelogs gerados por `changesets`
- [ ] `npx coiote@latest` funcionando sem instalação global

**Critério da Fase 4 / v1.0:**
- `npx coiote "crie um endpoint de autenticação"` funciona para qualquer usuário
- Documentação pública completa
- Zero vulnerabilidades conhecidas
- Cobertura de testes ≥ 85%
- Tempo de startup < 300ms
- Testado em macOS, Linux e Windows

---

## 7. Critérios de Entrada e Saída por Fase

| Fase | Critério de Entrada | Critério de Saída (DoD) |
|------|--------------------|-----------------------|
| **Fase 1** | Repositório criado, Node.js 20+ instalado | CLI funcional, loop E2E com 1 tarefa simples, UX de comunicação implementada, testes ≥ 70% |
| **Fase 2** | Fase 1 completa + projeto Express de teste disponível | Context loading automático, git integration, histórico navegável, testes ≥ 75% |
| **Fase 3** | Fase 2 completa + chaves de 2+ providers disponíveis | Multi-provider, headless mode, MCP, audit log, testes ≥ 80%, 0 CVE high |
| **Fase 4** | Fase 3 completa + decisão de nome/domínio final | v1.0 publicada, docs completa, startup < 300ms, testes ≥ 85% |

---

## 8. Gestão de Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| SDK da Anthropic mudar breaking changes | Média | Alto | Interface `LLMProvider` abstrai o SDK — mudança isolada em `anthropic.ts` |
| `ink` incompatibilidades com Windows | Alta | Médio | Testes de CI no Windows desde a Fase 1; fallback para output simples |
| Prompt injection comprometer usuário | Média | Crítico | `InjectionDetector` + system prompt defensivo + never-send-sensitive config |
| Custo de API explodir em loop infinito | Média | Alto | Rate limiter de tokens por sessão + MAX_ITERATIONS + timeout por task |
| Dependência crítica abandonada | Baixa | Alto | Preferir deps com grande adoção; manter abstração nos pontos de integração |
| Path traversal em produção | Baixa | Crítico | `PathValidator` obrigatório em todas as tools de FS desde a Fase 1 |
| Startup lento (> 1s) | Média | Médio | Lazy imports; medir startup em CI desde a Fase 2 |

---

## 9. Métricas de Progresso

### Métricas Técnicas (medidas a cada sprint)

```bash
# Cobertura de testes
pnpm test --coverage

# Startup time
time node dist/index.js --version

# Tamanho do bundle
du -sh dist/

# Vulnerabilidades
pnpm audit

# Complexidade ciclomática (target: < 10 por função)
pnpm run analyze
```

### Métricas de Qualidade da UX de Comunicação

Estas métricas devem ser avaliadas manualmente a cada fase com um teste de usabilidade informal:

| Cenário | Critério de Qualidade |
|---------|----------------------|
| Tarefa simples (criar arquivo) | Usuário entende o que vai acontecer antes de confirmar |
| Tarefa com erro | Usuário entende O QUÊ falhou e POR QUÊ sem consultar logs |
| Tarefa longa (> 30s) | Usuário nunca fica > 3s sem feedback visual |
| Ação irreversível | Usuário precisa digitar texto de confirmação — não é possível confirmar por acidente |
| Tarefa concluída | Usuário sabe exatamente o que foi feito, sem ambiguidade |

### Rastreamento de Fases

```
STATUS ATUAL: Fase 0 — Planejamento ✅

Fase 1:  [ ] Semana 1  [ ] Semana 2  [ ] Semana 3  [ ] Semana 4
Fase 2:  [ ] Semana 5  [ ] Semana 6  [ ] Semana 7  [ ] Semana 8
Fase 3:  [ ] Semana 9  [ ] Semana 10 [ ] Semana 11 [ ] Semana 12 [ ] Semana 13 [ ] Semana 14
Fase 4:  [ ] Semana 15 [ ] Semana 16 [ ] Semana 17 [ ] Semana 18 [ ] Semana 19 [ ] Semana 20
```

---

*Este orquestrador é um documento vivo. Atualize o status das tarefas e ajuste o roadmap conforme o projeto evolui.*

# Coiote - Progresso do Desenvolvimento

> Ultima atualizacao: 2026-03-03

---

## Visao Geral do Projeto

O Coiote e um assistente de desenvolvimento guiado por IA que roda na linha de comando. Ele planeja, escreve, refatora e executa codigo - mas sempre com comunicacao transparente com o usuario.

---

## Fases de Desenvolvimento

### Fase 1 - MVP Funcional (Semanas 1-4) - CONCLUIDA

**Status:** 100%

**Entregaveis:**

- Estrutura base do projeto (TypeScript + Node.js)
- REPL basico com entrada de texto
- Integracao com Anthropic API (tool use)
- Ferramentas: read_file, write_file, run_command
- Sistema de comunicacao basico (plano + progresso + resumo)
- Sistema de permissoes simples
- Testes unitarios para as ferramentas

### Fase 2 - Context Awareness (Semanas 5-8) - CONCLUIDA

**Status:** 100%

**Entregaveis:**

- Leitura automatica do coiote.config.md
- Context loading do codebase no inicio da sessao
- Git integration (status, diff, commit)
- Compactacao de contexto para conversas longas
- Modo verbose com raciocinio do LLM visivel
- Historico de sessao persistido

### Fase 3 - Agencia Completa (Semanas 9-14) - CONCLUIDA

**Status:** 100%

**Entregaveis:**

- [x] Multi-provider (Anthropic, OpenAI, Ollama)
- [x] Retry automatico com exponential backoff
- [x] Detector de loops infinitos
- [x] Rate limiter de tokens/requests
- [x] Recuperacao automatica de erros comuns
- [x] Slash commands (/plan, /explain, /undo, /commit, /test, /status)
- [x] Modo headless para CI/CD
- [x] Saida JSON estruturada
- [x] Exit codes semanticos
- [x] Comando coiote run -f tasks.md
- [x] Suporte a MCP servers (estrutura base)
- [x] Audit log de acoes criticas

### Fase 4 - Polimento (Semanas 15-20) - PENDENTE

**Status:** 0%

**Planejado:**

- TUI completa com ink (componentes visuais ricos)
- Syntax highlighting inline (codigo no terminal)
- Dashboard de uso e custos por sessao
- Plugin system para ferramentas customizadas
- Documentacao publica e exemplos
- Distribuicao via npm (npx coiote)

### TUI Rica (Semana 15) - EM ANDAMENTO

- [x] Syntax highlighting para preview de codigo
- [x] Componentes TUI avanzados (boxen)
- [x] Comando coiote demo

---

## Arquivos Principais

### src/agent/

| Arquivo            | Descricao                             |
| ------------------ | ------------------------------------- |
| agent.ts           | Loop agentico principal               |
| planner.ts         | Geracao e exibicao de planos          |
| context-manager.ts | Gerenciamento do context window       |
| compactor.ts       | Compactacao de historico longo        |
| slash-commands.ts  | Comandos slash (/plan, /explain, etc) |
| system-prompt.ts   | Prompt do sistema                     |

### src/providers/

| Arquivo      | Descricao                                 |
| ------------ | ----------------------------------------- |
| types.ts     | Interface LLMProvider                     |
| anthropic.ts | Provider Anthropic Claude                 |
| openai.ts    | Provider OpenAI (GPT-4, Gemini, DeepSeek) |
| ollama.ts    | Provider para modelos locais              |
| factory.ts   | Factory para instanciar providers         |

### src/tools/

| Arquivo     | Descricao                                                               |
| ----------- | ----------------------------------------------------------------------- |
| types.ts    | Interface Tool + ToolResult                                             |
| registry.ts | Registro central de tools                                               |
| filesystem/ | read-file, write-file, edit-file, delete-file, list-files, search-files |
| shell/      | run-command, run-tests, install-package                                 |
| git/        | git-status, git-diff, git-commit, git-branch                            |

### src/utils/

| Arquivo           | Descricao                       |
| ----------------- | ------------------------------- |
| retry.ts          | Retry com exponential backoff   |
| loop-protector.ts | Detector de loops infinitos     |
| rate-limiter.ts   | Rate limiter de tokens/requests |
| error-recovery.ts | Recuperacao automatica de erros |
| exit-codes.ts     | Códigos de saida semanticos     |
| headless-mode.ts  | Modo headless para CI/CD        |
| task-runner.ts    | Executor de tarefas de arquivo  |
| mcp-client.ts     | Cliente MCP                     |

### src/ui/

| Arquivo     | Descricao                                           |
| ----------- | --------------------------------------------------- |
| reporter.ts | Event bus de comunicacao                            |
| components/ | PlanDisplay, DiffPreview, ErrorDisplay, DoneDisplay |
| prompts.ts  | Wrappers de prompts interativos                     |

---

## Comandos Disponiveis

### Comando Principal

```bash
coiote "sua tarefa em linguagem natural"
```

**Opcoes:**

- `-m, --model <model>` - Modelo LLM a usar
- `-v, --verbose` - Saida detalhada
- `-q, --quiet` - Apenas erros e resumo final
- `-y, --auto` - Confirmar todas as acoes
- `--no-git` - Desabilitar integracao git
- `-H, --headless` - Modo headless para CI/CD
- `--json-pretty` - Saida JSON formatada
- `-f, --file <path>` - Executar tarefas de arquivo

### Comandos Adicionais

```bash
# Historico de sessoes
coiote history list
coiote history show <id>

# Configuracoes
coiote config show
coiote config set <key> <value>
coiote config set-provider <name>
coiote config set-key <provider> <key>

# Estatisticas
coiote data stats

# Inicializar projeto
coiote init
```

### Slash Commands (durante sessao interativa)

- `/plan` - Exibir plano atual
- `/explain` - Explicar o que foi feito
- `/undo` - Reverter ultima acao via git
- `/commit` - Forcar commit
- `/test` - Executar suite de testes
- `/status` - Resumo rapido
- `/help` - Ajuda

---

## Configuracao

### coiote.config.md

Arquivo de configuracao por projeto:

```markdown
# Coiote - Configuracoes do Projeto

## Contexto do Projeto

Aplicacao Node.js com Express e PostgreSQL.

## Comandos Uteis

- Testes: npm test
- Build: npm run build

## Permissoes

- Auto-commit apos tarefa: sim
- Perguntar antes de instalar pacotes: sim
```

---

## Status de Testes

| Comando        | Status |
| -------------- | ------ |
| pnpm typecheck | OK     |
| pnpm build     | OK     |
| pnpm test      | -      |

---

## Limites Configuraveis

| Parametro                      | Default        |
| ------------------------------ | -------------- |
| Max tokens por sessao          | 500,000        |
| Max requests por minuto        | 60             |
| Max iteracoes                  | 50             |
| Tempo maximo de execucao       | 10 minutos     |
| Threshold compactacao contexto | 100,000 tokens |

---

## Proximo Passo

A Fase 4 comecara em breve, focando em:

- TUI rica com syntax highlighting
- Plugin system
- Documentacao publica
- Publicacao npm

---

_Para detalhes completos, consulte os documentos em docs/_

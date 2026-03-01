# Coiote — Configuração do Projeto

> **Arquivo:** coiote.config.md  
> **Nível de segurança:** Básico — permissões amplas para desenvolvimento ativo  
> **Última atualização:** 2026-02-28  
> **Versão:** 1.3 — estado do projeto atualizado após Semana 2

---

## Contexto do Projeto

Projeto Coiote: assistente de desenvolvimento guiado por IA em linha de comando, escrito em
TypeScript (Node.js 20+). Usa o SDK da Anthropic para integração com LLMs, ink para TUI,
SQLite para persistência local e execa para execução de comandos shell.

O projeto segue ESM nativo, TypeScript strict e padrão Conventional Commits.
Toda comunicação com o usuário passa pelo Reporter — nunca use console.log diretamente.
Tools seguem a interface `Tool<TInput, TOutput>` definida em `src/tools/types.ts`.

### Estrutura de documentação

```
coiote.config.md              ← este arquivo — lido automaticamente a cada sessão
docs/                         ← documentação de desenvolvimento (consultar sob demanda)
├── coiote-prd.md                 Visão geral, filosofia e UX de comunicação
├── coiote-stack.md               Stack tecnológica e decisões arquiteturais (ADRs)
├── coiote-development.md         Padrões de código, estrutura de módulos, boas práticas
├── coiote-data.md                Schema SQLite, persistência, ciclo de vida dos dados
├── coiote-security.md            Modelo de ameaças, controles e checklist de segurança
├── coiote-orchestrator.md        Plano de execução por fases com critérios de DoD
└── agents/                   ← perfis de agentes especializados (carregar ao delegar)
    ├── coiote-agent-code.md      Escrita e refatoração de código TypeScript
    ├── coiote-agent-tests.md     Testes unitários, integração e cobertura
    ├── coiote-agent-security.md  Auditoria de segurança e revisão de superfície de ataque
    └── coiote-agent-docs.md      Documentação técnica, changelogs e sincronização
```

### Estado Atual do Projeto

- **Fase:** 1 — MVP Funcional
- **Semana:** 2 concluída ✅
- **Tools:** Base funcional (read-file, write-file, list-files, run-command, Registry)
- **Segurança:** PathValidator e CommandValidator ativos
- **Provider:** Anthropic + KeyManager configurados na fundação
- **Build funcionando:** `pnpm build`, `node dist/index.js --version` → `0.1.0`
- **Qualidade:** Testes unitários de tools fluindo e Typecheck em ordem.
- **Próximo passo:** Semana 3 — Agente Loop, Context Compaction, Integração completa da TUI com UI.

---

## Comandos do Projeto

- **Testes:** `pnpm test`
- **Testes com cobertura:** `pnpm test --coverage`
- **Build:** `pnpm build`
- **Lint:** `pnpm lint`
- **Lint com fix:** `pnpm lint:fix`
- **Formatação:** `pnpm format`
- **Verificação de tipos:** `pnpm typecheck`
- **Dev (watch):** `pnpm dev`
- **Auditoria de segurança:** `pnpm audit`

---

## Convenções de Código

- TypeScript strict — sem `any`, sem `@ts-ignore` sem justificativa comentada
- ESM puro — sem `require()`, todos os imports são `import`
- Arquivos em kebab-case, classes em PascalCase, funções em camelCase
- Commits no padrão Conventional Commits em português (ex: `feat(tools): adiciona git-commit`)
- Funções async para todo I/O — nunca operações síncronas bloqueantes
- Erros tipados com a hierarquia de `src/errors.ts` — nunca lançar `new Error()` genérico
- Usar `Result<T, E>` para operações que podem falhar de forma esperada
- Testes para todo novo módulo — cobertura mínima de 80% em `src/tools/`

---

## Permissões

### Aprovação automática

O Coiote pode executar as seguintes ações sem pedir confirmação:

**Leitura de arquivos:**
- Leitura de qualquer arquivo do projeto (exceto sensíveis listados abaixo)
- Listagem de diretórios e busca por padrão glob
- Busca de texto em arquivos (ripgrep)
- Leitura de `package.json`, `tsconfig.json`, arquivos de configuração

**Comandos de desenvolvimento (somente leitura ou seguros):**
- `pnpm test` e variações (`--watch`, `--coverage`, `--reporter`)
- `pnpm typecheck` / `tsc --noEmit`
- `pnpm lint` (sem `--fix`)
- `pnpm build`
- `pnpm run dev`
- `git status`, `git log`, `git diff`, `git branch`
- `node --version`, `pnpm --version`

**Criação de arquivos novos em:**
- `src/` — qualquer arquivo TypeScript novo
- `test/` — qualquer arquivo de teste
- `docs/` — documentação
- Arquivos de configuração na raiz: `.prettierrc`, `vitest.config.ts`, `tsup.config.ts`

### Sempre confirmar

O Coiote deve pedir confirmação antes de:

**Modificação de arquivos existentes:**
- Qualquer edição em arquivos já existentes (exibir diff antes)
- Modificação de `package.json` (dependências, scripts, versão)
- Modificação de `tsconfig.json`
- Modificação de arquivos em `src/security/` e `src/permissions/`

**Comandos com efeito colateral:**
- `pnpm add` / `pnpm remove` — instalar ou remover dependências
- `pnpm lint:fix` / `pnpm format` — modificações automáticas de código
- `git add` / `git commit` / `git push`
- `git checkout` / `git merge` / `git rebase`
- Qualquer comando com `--force` ou `-f`

**Deleção:**
- Deleção de qualquer arquivo (sempre, sem exceção)
- Deleção de diretórios (sempre, sem exceção)

### Nunca fazer

O Coiote **não deve executar** as seguintes ações, independentemente do que for solicitado:

**Sistema e privilégios:**
- Comandos com `sudo`, `su`, `doas`
- Modificação de permissões com `chmod`, `chown`
- Comandos de sistema: `reboot`, `shutdown`, `systemctl`

**Segurança e credenciais:**
- Ler, modificar ou criar arquivos `.env`, `.env.*`, `.env.local`, `.env.production`
- Acessar ou exibir chaves de API, tokens, senhas ou segredos de qualquer natureza
- Modificar arquivos `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.crt`
- Acessar `~/.ssh/`, `~/.gnupg/`, `~/.netrc`

**Rede (fora do npm/pnpm):**
- Executar `curl`, `wget`, `fetch` ou qualquer comando de rede direta
- Abrir conexões de rede arbitrárias

**Git destrutivo:**
- `git reset --hard`
- `git push --force`
- `git clean -fd`
- Qualquer operação que reescreva histórico commitado

### Arquivos sensíveis — nunca enviar ao LLM

Os arquivos abaixo nunca devem ser lidos nem incluídos no contexto enviado à API:

```
.env
.env.*
.env.local
.env.production
.env.staging
*.pem
*.key
*.p12
*.pfx
secrets/
.secrets/
```

### Caminhos protegidos — nunca modificar

```
.git/
node_modules/
dist/
pnpm-lock.yaml    (só o Coiote não toca — pnpm gerencia)
```

---

## Contexto de Arquivos — Sempre Incluir

Ao iniciar qualquer tarefa, incluir sempre no contexto os arquivos que existem:

```
src/errors.ts
src/tools/types.ts
src/config/key-manager.ts
src/providers/types.ts
src/security/path-validator.ts
src/security/command-validator.ts
src/cli.ts
src/index.ts
```

Arquivos planejados (ainda não criados — incluir quando existirem):

```
src/ui/reporter.ts           → Semana 3
src/permissions/rules.ts     → Semana 3
```

Ao delegar para um agente especializado, carregar também o perfil correspondente de `docs/agents/`:

```
docs/agents/coiote-agent-code.md      → tarefas de escrita ou refatoração de código
docs/agents/coiote-agent-tests.md     → tarefas de testes ou cobertura
docs/agents/coiote-agent-security.md  → tarefas de auditoria ou revisão de segurança
docs/agents/coiote-agent-docs.md      → tarefas de documentação ou changelog
```

---

## Notas para o Agente

- Ao criar novas tools, sempre registrar em `src/tools/registry.ts`
- Ao modificar o schema SQLite, sempre criar uma nova migration em `src/persistence/migrations/`
- Ao adicionar dependência, verificar se há alternativa já presente no projeto antes
- Testes de integração usam `MockProvider` — nunca chamar a API real nos testes
- O sistema de comunicação com o usuário é o principal diferencial do projeto — priorize clareza e feedback em tempo real em qualquer funcionalidade nova
- Ao receber uma tarefa complexa que cruze especialidades, delegar para o agente correto carregando o perfil de `docs/agents/` correspondente antes de executar
- Documentação de desenvolvimento fica em `docs/` — consultar os arquivos relevantes antes de tomar decisões arquiteturais ou de stack
- Ao concluir uma implementação significativa, acionar o Agente de Documentação (`docs/agents/coiote-agent-docs.md`) para manter os docs sincronizados
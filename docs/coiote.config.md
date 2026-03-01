# Coiote — Configuração do Projeto

> **Arquivo:** coiote.config.md  
> **Nível de segurança:** Básico — permissões amplas para desenvolvimento ativo  
> **Última atualização:** 2026-02-28

---

## Contexto do Projeto

Projeto Coiote: assistente de desenvolvimento guiado por IA em linha de comando, escrito em
TypeScript (Node.js 20+). Usa o SDK da Anthropic para integração com LLMs, ink para TUI,
SQLite para persistência local e execa para execução de comandos shell.

O projeto segue ESM nativo, TypeScript strict e padrão Conventional Commits.
Toda comunicação com o usuário passa pelo Reporter — nunca use console.log diretamente.
Tools seguem a interface `Tool<TInput, TOutput>` definida em `src/tools/types.ts`.

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

Ao iniciar qualquer tarefa, incluir sempre no contexto:

```
src/tools/types.ts
src/providers/types.ts
src/ui/reporter.ts
src/errors.ts
src/permissions/rules.ts
```

---

## Notas para o Agente

- Ao criar novas tools, sempre registrar em `src/tools/registry.ts`
- Ao modificar o schema SQLite, sempre criar uma nova migration em `src/persistence/migrations/`
- Ao adicionar dependência, verificar se há alternativa já presente no projeto antes
- Testes de integração usam `MockProvider` — nunca chamar a API real nos testes
- O sistema de comunicação com o usuário é o principal diferencial do projeto — priorize clareza e feedback em tempo real em qualquer funcionalidade nova
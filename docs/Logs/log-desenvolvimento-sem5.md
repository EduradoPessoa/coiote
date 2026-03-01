# 🐺 Coiote — Log de Desenvolvimento (Semana 5 - Fase 2 Iniciada)

---

## 2026-02-28 — Início da Fase 2: Configurações de Projeto e Integração Git

**Data e hora:** 2026-02-28T23:15:00-03:00

### Prompt Recebido Principal

> Leia coiote.config.md e docs/coiote-orchestrator.md.
> Vamos desenvolver a semana 5, iniciando a fase 2
> 
> Crie um documento chamado log-desenvolvimento-sem5.md na pasta /DOCS/Logs/ e ne registre data e hora, Prompt passado para você aqui, e sua resposta final.

---

### O que foi Feito

| Componente | Mudança | Detalhes Técnicos |
|------------|---------|----------|
| **Project Config (`src/config/project-config.ts`)**  | Construído do 0 | Criado analisador interativo que lê `coiote.config.md` se presente na raiz do projeto onde foi acionado. Ele extrai de títulos formatados em Markdown as propriedades: context (contexto global), commands (aliases de terminal mapeados), permissions (regras `autoApprove`, `neverDo`, `alwaysConfirm`), defaults e sensitive exclusions (arquivos sigilosos).  |
| **Comando CLI `coiote init`**| Mapeado e adicionado no Commander | Acoplada uma UI simples em `cli.ts` -> `program.command('init')` que aciona internamente `initializeProject()` para popular dinamicamente no diretório corrente o scaffolding do _coiote.config.md_ | 
| **Ferramentas de Git (_Git Tools_)** | `gitStatusTool`, `gitCommitTool`, `gitBranchTool`, `gitDiffTool` | Wrapper direto conectando a lib recomendada `simple-git` para dentro do contexto `Tools`. O Coiote agora usa comandos para ler patches do repo e gerar branches inteligentemente. O tool `git_commit` foi marcado como operação **destrutiva**, dependendo de confirmação da UI Inquirer. |
| **Commit Automático** | Agent End-Of-Life Logic | Na rotina síncrona de shutdown do `CoioteAgent` em `src/agent/agent.ts`, injetado check condicional consultando `globalConfig`. Caso ativada, o agende encerra a session e aciona `git add .` + `git commit` registrando como autor a sua numeração hash UUID de traceablity provando que a feature _autoCommit_ configurável ocorreu após a conclusão da tarefa natural do pipeline. |

### Cheques efetuados!

✔️ Repositório tipado via `pnpm typecheck` cobrindo que config loaders chegassem sem underfined properties à raiz. 
✔️ Ferramentas Git expostas na CLI main function e cadastradas no `ToolRegistry` com segurança.
✔️ MVP Test mantido passável com novos dependencies injeções.

A estrutura começa a transitar para ganhar total Consciência de Ambientes! 🐺 

---

## 2026-03-01 — Semana 6: Context Loading Inteligente e Segurança de Dados

**Data e hora:** 2026-03-01T23:25:00-03:00

### O que foi Feito

| Componente | Mudança | Detalhes Técnicos |
|------------|---------|----------|
| **`ContextManager` (`src/agent/context-manager.ts`)** | Implementação Base | Criada lógica de carregamento de arquivos com **truncamento inteligente** (head/tail + resumo de estrutura/símbolos) para arquivos >200 linhas. Isso economiza tokens mantendo a visão estrutural do código. |
| **`ContentSanitizer` (`src/security/content-sanitizer.ts`)** | Detector de Segredos | Implementada sanitização de conteúdos que remove API Keys (sk-ant, sk-...), segredos de banco, tokens JWT e Chaves Privadas antes de enviá-los ao provedor de LLM. |
| **`InjectionDetector` (`src/security/injection-detector.ts`)** | Scan Anti-Prompt-Injection | Implementado scan de arquivos por padrões de "indirect prompt injection" (ex: "ignore previous instructions"). Impede que o código do projeto manipule o comportamento do agende. |
| **Integração no Agente** | System Prompt Dinâmico | O `CoioteAgent` agora utiliza o `ContextManager` para carregar o contexto inicial de arquivos definidos como `alwaysInclude` no `coiote.config.md`, injetando-os de forma segura no início da conversa. |
| **`read_file` Tool Seguro** | Upgrade de Segurança | A ferramenta de leitura de arquivos agora passa obrigatoriamente pelos scans de injeção e sanitização antes de retornar o valor ao LLM. |

### Cheques efetuados!

✔️ `pnpm typecheck` aprovado.
✔️ `pnpm test` aprovado.
✔️ Proteção de dados sensíveis validada por regex.

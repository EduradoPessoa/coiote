# Coiote — Agente de Documentação

> **Arquivo:** docs/agents/coiote-agent-docs.md  
> **Herda:** coiote.config.md  
> **Especialidade:** Documentação técnica, changelogs e sincronização de docs com código

---

## Papel e Escopo

Este agente é responsável por **manter a documentação do projeto sincronizada com o código**.
Ele age quando implementações são concluídas, APIs mudam, fases do roadmap avançam ou
a documentação fica desatualizada em relação à realidade do projeto.

**Dentro do escopo:**
- Atualizar `docs/*.md` quando implementações mudam interfaces ou comportamentos
- Gerar e atualizar o `CHANGELOG.md` com base em commits ou PRs
- Manter o `README.md` público com exemplos funcionais e atualizados
- Atualizar `coiote.config.md` quando novas ferramentas ou convenções são adicionadas
- Documentar novas tools em `docs/coiote-development.md` (seção de Tools)
- Manter o `coiote-orchestrator.md` com status atualizado das fases
- Gerar docstrings JSDoc para funções e interfaces sem documentação
- Manter `docs/agents/` sincronizado quando o escopo de agentes muda

**Fora do escopo — delegar para o agente correto:**
- Modificar código de produção → `coiote-agent-code.md`
- Escrever testes → `coiote-agent-tests.md`

---

## Contexto Sempre Incluído

```
docs/coiote-prd.md           ← visão e filosofia — referência para tom e linguagem
docs/coiote-development.md   ← padrões — o que deve estar documentado
coiote.config.md             ← config operacional — atualizar quando necessário
README.md                    ← documento público — manter atualizado
CHANGELOG.md                 ← histórico de versões — atualizar a cada release
```

Carregar sob demanda:

```
docs/coiote-orchestrator.md  ← quando atualizar status de fases
docs/agents/                 ← quando escopo de agentes muda
src/tools/types.ts           ← quando documentar nova interface de tool
```

---

## Ferramentas Disponíveis

| Tool | Uso neste agente |
|------|-----------------|
| `read_file` | Ler código e docs para sincronização |
| `write_file` | Criar novos arquivos de documentação |
| `edit_file` | Atualizar docs existentes |
| `list_files` | Explorar estrutura de `docs/` e `src/` |
| `search_files` | Encontrar funções sem docstring, TODOs, referências desatualizadas |
| `git_diff` | Ver o que mudou para saber o que documentar |
| `git_log` | Listar commits para geração de changelog |

**Não disponível neste agente:**
- `write_file` em `src/` — não modifica código de produção
- `run_command` além de `git log` e `git diff`
- `git_commit` — commit só após revisão do Orchestrator

---

## Permissões Específicas

**Aprovação automática:**
- Criar e editar qualquer arquivo em `docs/`
- Editar `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`
- Adicionar ou atualizar JSDoc em `src/` (comentários apenas, não lógica)

**Sempre confirmar:**
- Editar `coiote.config.md` — afeta comportamento operacional
- Editar qualquer arquivo em `docs/agents/` — afeta escopo de outros agentes
- Qualquer edição em `src/` além de comentários JSDoc

---

## Convenções de Documentação

### Tom e linguagem

- **Português** para toda documentação interna do projeto
- **Direto e técnico** — sem floreios, sem frases de efeito vazias
- **Exemplos concretos** — toda convenção ou API deve ter um exemplo de código
- **Consistência** com o glossário de `docs/coiote-prd.md` — usar os mesmos termos

### Estrutura de documentos

Todo arquivo de `docs/` deve ter:

```markdown
# Título Descritivo

> **Documento:** nome-do-arquivo.md
> **Versão:** X.Y
> **Escopo:** Uma linha descrevendo o que este documento cobre

---

## Sumário
[Links âncora para cada seção]

---
[Conteúdo das seções]
```

### JSDoc para funções públicas

```typescript
/**
 * Executa a tool e retorna o resultado.
 *
 * @param input - Parâmetros tipados conforme `inputSchema`
 * @param ctx - Contexto de execução: projectRoot, reporter, permissionManager, signal
 * @returns ToolResult com `success`, `summary` e opcionalmente `value` ou `error`
 *
 * @example
 * const result = await writeFileTool.execute(
 *   { path: 'src/auth.ts', content: '...' },
 *   ctx,
 * );
 * if (!result.success) console.error(result.error);
 */
async execute(input: WriteFileInput, ctx: ToolContext): Promise<ToolResult<void>>
```

---

## Changelog — Formato

O `CHANGELOG.md` segue o padrão [Keep a Changelog](https://keepachangelog.com):

```markdown
# Changelog

## [Unreleased]

### Adicionado
- Tool `edit_file` com geração de diff pontual (#42)
- Provider Ollama para modelos locais (#38)

### Modificado
- `PermissionManager` agora suporta regras por glob path (#45)

### Corrigido
- Loop agêntico não respeitava MAX_ITERATIONS em casos de tool error (#41)

### Removido
- Suporte a Node.js 18 (mínimo agora é 20) (#39)

---

## [0.2.0] — 2026-03-15

[...]
```

**Regras do changelog:**
- Entradas em português, no passado, começando com verbo
- Referenciar issue/PR com `(#N)` quando disponível
- Agrupar em: Adicionado, Modificado, Corrigido, Removido, Segurança
- Versão `[Unreleased]` para mudanças ainda não em release

---

## Sincronização Pós-Implementação

Quando o Code Agent conclui uma implementação, verificar e atualizar:

### Nova Tool adicionada
- [ ] `docs/coiote-development.md §4` — adicionar à tabela de tools
- [ ] `coiote.config.md` — adicionar à lista de aprovação automática se aplicável
- [ ] `CHANGELOG.md` — entrada em `[Unreleased] > Adicionado`
- [ ] `README.md` — atualizar exemplos se a tool é relevante para o usuário final

### Novo Provider LLM adicionado
- [ ] `docs/coiote-stack.md §4` — atualizar tabela de providers com status
- [ ] `README.md` — adicionar na seção de configuração
- [ ] `CHANGELOG.md` — entrada em `[Unreleased] > Adicionado`

### Mudança no sistema de permissões
- [ ] `docs/coiote-prd.md §6` — verificar se a filosofia ainda está descrita corretamente
- [ ] `coiote.config.md` — exemplos de permissões ainda são válidos?
- [ ] `docs/agents/*.md` — seções de permissões dos agentes precisam de atualização?

### Fase do roadmap concluída
- [ ] `docs/coiote-orchestrator.md` — marcar tarefas como `[x]` e atualizar status
- [ ] `CHANGELOG.md` — criar nova seção de versão com tudo da fase
- [ ] `README.md` — atualizar seção de features disponíveis

---

## Exemplos de Tarefas para este Agente

```bash
coiote --agent docs "a tool edit_file foi implementada — atualize a documentação"
coiote --agent docs "gere o CHANGELOG da versão 0.2.0 com base nos commits da fase 2"
coiote --agent docs "o README está desatualizado — atualize com as features da fase 1"
coiote --agent docs "adicione JSDoc a todas as funções públicas de src/tools/filesystem/"
coiote --agent docs "a fase 1 foi concluída — marque as tarefas no orchestrator"
coiote --agent docs "revise todos os docs/agents/ e verifique inconsistências entre eles"
```

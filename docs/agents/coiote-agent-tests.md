# Coiote — Agente de Testes

> **Arquivo:** docs/agents/coiote-agent-tests.md  
> **Herda:** coiote.config.md  
> **Especialidade:** Escrita de testes, cobertura e validação de qualidade

---

## Papel e Escopo

Este agente é responsável por **garantir a qualidade do código através de testes**. Ele age quando
a tarefa envolve criar testes para código novo, aumentar cobertura, corrigir testes quebrados
ou validar que uma implementação funciona corretamente.

**Dentro do escopo:**
- Escrever testes unitários para tools, providers, utils e módulos de agent
- Escrever testes de integração com `MockProvider`
- Criar e manter fixtures de projetos em `test/fixtures/`
- Executar suites de testes e interpretar resultados
- Identificar e corrigir testes quebrando
- Aumentar cobertura de módulos abaixo do mínimo (80% em `src/tools/`)
- Criar helpers de teste reutilizáveis em `test/helpers/`

**Fora do escopo — delegar para o agente correto:**
- Corrigir o código de produção que está falhando → `coiote-agent-code.md`
- Auditar segurança de código → `coiote-agent-security.md`
- Atualizar documentação de APIs testadas → `coiote-agent-docs.md`

---

## Contexto Sempre Incluído

```
src/tools/types.ts           ← interface Tool e ToolResult — base para testar tools
src/errors.ts                ← hierarquia de erros — testar todos os casos de erro
test/helpers/                ← helpers existentes — não duplicar
vitest.config.ts             ← configuração do runner de testes
```

Carregar sob demanda:

```
src/tools/[tool-alvo].ts     ← implementação que está sendo testada
test/fixtures/               ← explorar fixtures disponíveis antes de criar novos
```

---

## Ferramentas Disponíveis

| Tool | Uso neste agente |
|------|-----------------|
| `read_file` | Ler implementações a serem testadas e testes existentes |
| `write_file` | Criar novos arquivos de teste |
| `edit_file` | Corrigir testes existentes |
| `list_files` | Explorar `test/` e `src/` |
| `search_files` | Encontrar funções exportadas, casos de uso, padrões existentes |
| `run_tests` | Executar testes e analisar resultados |
| `run_command` | `pnpm test --coverage` para medir cobertura |

**Não disponível neste agente:**
- `write_file` em `src/` — não modifica código de produção
- `git_commit` — commit só após aprovação do Orchestrator
- `install_package` — adicionar dependências de teste passa pelo Orchestrator

---

## Permissões Específicas

Herda todas as permissões de `coiote.config.md` com os seguintes refinamentos:

**Aprovação automática adicional:**
- Criar e editar qualquer arquivo em `test/` sem confirmação
- Criar e editar fixtures em `test/fixtures/` sem confirmação
- Executar `pnpm test`, `pnpm test --coverage`, `pnpm test --watch` sem confirmação
- Executar testes de arquivo específico: `pnpm test test/unit/tools/write-file.test.ts`

**Bloqueado para este agente:**
- Modificar qualquer arquivo em `src/` — leitura apenas
- Modificar `vitest.config.ts` sem confirmação explícita

---

## Estrutura de Testes

### Organização de arquivos

```
test/
├── unit/                         # Espelha src/ — um arquivo por módulo
│   ├── tools/
│   │   ├── filesystem/
│   │   │   ├── read-file.test.ts
│   │   │   ├── write-file.test.ts
│   │   │   └── ...
│   │   └── shell/
│   │       └── run-command.test.ts
│   ├── agent/
│   │   └── agent.test.ts
│   └── security/
│       ├── path-validator.test.ts
│       └── command-validator.test.ts
│
├── integration/                  # Fluxos fim-a-fim com LLM mockado
│   ├── agent-basic-task.test.ts
│   ├── agent-error-recovery.test.ts
│   └── agent-context-loading.test.ts
│
├── helpers/                      # Utilitários reutilizáveis
│   ├── mock-context.ts           # Cria ToolContext mockado
│   ├── mock-provider.ts          # LLMProvider que retorna fixtures
│   ├── temp-project.ts           # Projeto temporário para testes de FS
│   └── assertions.ts             # Assertions customizadas
│
└── fixtures/                     # Projetos fictícios para contexto
    ├── express-api/              # API Express simples
    ├── react-app/                # App React (CRA)
    └── python-flask/             # Projeto Python Flask
```

### Anatomia de um teste unitário de Tool

```typescript
// test/unit/tools/filesystem/write-file.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeFileTool } from '../../../../src/tools/filesystem';
import { createMockContext } from '../../../helpers/mock-context';
import { TempProject } from '../../../helpers/temp-project';

describe('writeFileTool', () => {
  let ctx: ToolContext;
  let project: TempProject;

  beforeEach(async () => {
    project = await TempProject.create();
    ctx = createMockContext({
      projectRoot: project.path,
      permissionManager: {
        request: vi.fn().mockResolvedValue(true),  // Aprovação automática nos testes
      },
    });
  });

  afterEach(async () => {
    await project.cleanup();
  });

  // ✅ Happy path — sempre testar primeiro
  it('deve criar arquivo novo e retornar sucesso', async () => {
    const result = await writeFileTool.execute(
      { path: 'src/auth.ts', content: 'export const x = 1;' },
      ctx,
    );

    expect(result.success).toBe(true);
    expect(result.summary).toContain('src/auth.ts');
    expect(await project.fileExists('src/auth.ts')).toBe(true);
  });

  // ✅ Permissão negada — sempre testar
  it('deve retornar falha quando permissão negada', async () => {
    ctx.permissionManager.request = vi.fn().mockResolvedValue(false);

    const result = await writeFileTool.execute(
      { path: 'src/auth.ts', content: '...' },
      ctx,
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cancelado');
    expect(await project.fileExists('src/auth.ts')).toBe(false);
  });

  // ✅ Erro de sistema — sempre testar
  it('deve retornar erro legível quando path é inválido', async () => {
    const result = await writeFileTool.execute(
      { path: '../fora-do-projeto/evil.ts', content: '...' },
      ctx,
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/fora do projeto|path traversal/i);
  });

  // ✅ Metadados do resultado — sempre verificar
  it('resultado deve ter summary não vazio', async () => {
    const result = await writeFileTool.execute(
      { path: 'test.ts', content: '' },
      ctx,
    );

    expect(result.summary).toBeTruthy();
    expect(result.summary.length).toBeGreaterThan(0);
  });
});
```

### Anatomia de um teste de integração

```typescript
// test/integration/agent-basic-task.test.ts
import { describe, it, expect } from 'vitest';
import { CoioteAgent } from '../../src/agent/agent';
import { MockProvider } from '../helpers/mock-provider';
import { TempProject } from '../helpers/temp-project';

describe('Agent — tarefa básica de criação de arquivo', () => {
  it('deve criar README.md quando solicitado', async () => {
    const project = await TempProject.fromFixture('express-api');

    const agent = new CoioteAgent({
      provider: new MockProvider({
        // Fixture com respostas pré-gravadas do LLM para este cenário
        fixture: 'create-readme',
        // Aprovação automática de todas as confirmações
        autoApprove: true,
      }),
      projectRoot: project.path,
    });

    await agent.run('crie um README.md para este projeto');

    expect(await project.fileExists('README.md')).toBe(true);
    const content = await project.readFile('README.md');
    expect(content).toContain('#');  // Tem pelo menos um heading

    await project.cleanup();
  });
});
```

---

## Metas de Cobertura

| Caminho | Cobertura Mínima | Prioridade |
|---------|-----------------|------------|
| `src/tools/` | 80% | 🔴 Alta |
| `src/security/` | 85% | 🔴 Alta |
| `src/permissions/` | 75% | 🟡 Média |
| `src/agent/` | 70% | 🟡 Média |
| `src/providers/` | 65% | 🟢 Normal |
| `src/ui/` | 60% | 🟢 Normal |

Para verificar cobertura atual:
```bash
pnpm test --coverage
```

---

## O que Testar em Cada Tool

Para cada tool, o Test Agent deve garantir cobertura de:

1. **Happy path** — execução normal com sucesso
2. **Permissão negada** — `permissionManager.request()` retorna `false`
3. **Erro de sistema** — falha de I/O, arquivo não encontrado, permissão de OS
4. **Input inválido** — path traversal, path vazio, conteúdo inesperado
5. **Cancelamento** — `AbortSignal` disparado durante execução
6. **Metadados** — `result.summary` sempre preenchido, `result.success` correto

---

## Exemplos de Tarefas para este Agente

```bash
coiote --agent tests "escreva testes unitários para a tool edit_file"
coiote --agent tests "a cobertura de src/security/ está em 45% — aumente para 85%"
coiote --agent tests "o teste agent-error-recovery está falhando — investigue e corrija"
coiote --agent tests "crie fixture de projeto Python Flask para testes de integração"
coiote --agent tests "adicione teste de cancelamento via AbortSignal para run-command"
```

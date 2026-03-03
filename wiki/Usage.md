# Uso

Aprenda a usar o Coiote nos diferentes modos disponíveis.

---

## Uso Básico

### Execução direta

```bash
coiote "sua tarefa aqui"
```

### Modo interativo

```bash
coiote
# Ou simplesmente
coiote -i
```

---

## Modo Interativo

No modo interativo, você pode digitar múltiplas tarefas:

```bash
coiote
```

```
❯ coiote

Bem-vindo ao Coiote!
Digite sua tarefa ou 'sair' para encerrar

> criar arquivo teste.js
```

---

## Modo Headless

Para automação e CI/CD, use o modo headless:

```bash
coiote -y "executar testes"
```

Ou defina a variável de ambiente:

```bash
export COIOTE_AUTO_APPROVE=true
coiote "sua tarefa"
```

---

## Flags Comuns

| Flag                | Descrição              |
| ------------------- | ---------------------- |
| `-v, --verbose`     | Modo verboso           |
| `-q, --quiet`       | Modo silencioso        |
| `-y, --yes`         | Aprovar todas as ações |
| `-m, --model`       | Especificar modelo     |
| `-p, --provider`    | Especificar provider   |
| `-i, --interactive` | Modo interativo        |
| `--version`         | Mostrar versão         |
| `--help`            | Mostrar ajuda          |

### Exemplos

```bash
# Modo verboso
coiote -v "criar componente"

# Mudo (apenas erros)
coiote -q "refatorar código"

# Aprovação automática
coiote -y "executar testes"

# Modelo específico
coiote -m claude-opus-4-20250514 "tarefa"

# Provider específico
coiote -p openai "tarefa"
```

---

## Arquivos de Tarefas

Crie um arquivo `.md` para definir múltiplas tarefas:

```markdown
# Tarefa: Setup do Projeto

## Passo 1: Instalar dependências

Instalar todas as dependências do projeto

## Passo 2: Configurar ESLint

Criar configuração básica do ESLint

## Passo 3: Criar estrutura de pastas

Criar diretórios src/, test/, docs/
```

### Executar arquivo de tarefas

```bash
coiote --task arquivo.md
# ou
coiote --file tarefa.md
```

---

## Fluxo de Trabalho Típico

### 1. O Coiote analisa a tarefa

```
📋 PLANO DE EXECUÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Entendi: Criar componente React

Vou executar os seguintes passos:
1. Verificar estrutura do projeto
2. Criar arquivo do componente
3. Criar arquivo de estilos
4. Criar teste básico
```

### 2. Você aprova ou rejeita

```
Continuar? [S/n]
```

### 3. O Coiote executa

```
⚡ EXECUTANDO PASSO 2/4
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Criando arquivo: src/components/Button.tsx
```

### 4. Feedback em tempo real

```
✅ Componente criado com sucesso!
```

---

## Interrupção

A qualquer momento você pode:

- **Ctrl+C** — Interromper execução
- **n** — Rejeitar ação atual
- **s** — Pular próximo passo
- **q** — Sair completamente

---

## Histórico de Sessões

```bash
# Listar sessões
coiote history list

# Ver sessão específica
coiote history show <id>
```

---

## Modos de Saída

### JSON output

```bash
coiote "tarefa" --json
```

### Markdown output

```bash
coiote "tarefa" --markdown
```

---

## Variáveis de Ambiente Úteis

```bash
# Para debug
export DEBUG=coiote:*

# Para silêncio
export COIOTE_QUIET=true

# Para auto-aprove
export COIOTE_AUTO_APPROVE=true
```

# Comandos

Referência completa de todos os comandos disponíveis no Coiote.

---

## Comandos Principais

### coiote "prompt"

Executar uma tarefa com o Coiote.

```bash
coiote "criar arquivo index.html"
coiote "adicionar autenticação JWT"
coiote "executar testes unitários"
```

**Aliases:** `c`, `run`

---

## history

Gerenciar histórico de sessões.

### history list

Listar todas as sessões anteriores.

```bash
coiote history list
coiote history list --limit 10
```

**Output:**

```
┌─────────────────────────────────────────────┐
│  Histórico de Sessões                        │
├──────┬──────────────────────┬───────────────┤
│ ID   │ Data                 │ Tarefa        │
├──────┼──────────────────────┼───────────────┤
│ 001  │ 2026-03-03 14:30     │ Criar comp... │
│ 002  │ 2026-03-03 15:45     │ Executar t... │
└──────┴──────────────────────┴───────────────┘
```

### history show

Visualizar uma sessão específica.

```bash
coiote history show 001
coiote history show 001 --verbose
```

---

## config

Gerenciar configurações.

### config show

Mostrar configuração atual.

```bash
coiote config show
```

**Output:**

```
┌─────────────────────────────────────────────┐
│  Configuração do Coiote                      │
├─────────────────────────────────────────────┤
│  Provider:    anthropic                     │
│  Modelo:      claude-sonnet-4-20250514      │
│  Temperature: 0.7                           │
│  Max Tokens:  4096                          │
└─────────────────────────────────────────────┘
```

### config set

Definir uma configuração.

```bash
# Definir provider
coiote config set provider anthropic
coiote config set provider openai
coiote config set provider ollama

# Definir modelo
coiote config set model claude-sonnet-4-20250514
coiote config set model gpt-4-turbo

# Definir temperatura
coiote config set temperature 0.7

# Definir max tokens
coiote config set maxTokens 4096
```

### config list

Listar todas as configurações disponíveis.

```bash
coiote config list
```

### config get

Obter valor de uma configuração específica.

```bash
coiote config get provider
coiote config get model
```

---

## data

Gerenciar dados do Coiote.

### data stats

Mostrar estatísticas de uso.

```bash
coiote data stats
```

**Output:**

```
┌─────────────────────────────────────────────┐
│  Estatísticas do Coiote                     │
├─────────────────────────────────────────────┤
│  Sessões:     42                            │
│  Comandos:    156                          │
│  Arquivos:    89                            │
│  Provider:   anthropic (100%)              │
└─────────────────────────────────────────────┘
```

### data clear

Limpar dados (com confirmação).

```bash
# Limpar histórico
coiote data clear history

# Limpar tudo
coiote data clear all
```

---

## init

Inicializar o Coiote no projeto atual.

```bash
coiote init
```

Cria um arquivo `coiote.config.md` com configurações padrão.

---

## help

Mostrar ajuda.

```bash
coiote --help
coiote help history
coiote help config
```

---

## version

Mostrar versão.

```bash
coiote --version
coiote -V
```

---

## Flags Globais

| Flag            | Descrição               |
| --------------- | ----------------------- |
| `-v, --verbose` | Modo verboso            |
| `-q, --quiet`   | Modo silencioso         |
| `-y, --yes`     | Aprovar automaticamente |
| `--json`        | Saída em JSON           |
| `--no-color`    | Sem cores               |

---

## Atalhos

```bash
# Executar tarefa
c "tarefa"

# Histórico
h list
h show 001

# Config
cfg show
cfg set model gpt-4

# Estatísticas
stats
```

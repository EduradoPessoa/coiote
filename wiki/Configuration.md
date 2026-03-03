# Configuração

Guia completo sobre como configurar o Coiote.

---

## Configuração de API Keys

### Variáveis de Ambiente

O Coiote usa variáveis de ambiente para armazenar chaves de API:

```bash
# Anthropic (padrão)
export ANTHROPIC_API_KEY=sk-ant-sua-chave-aqui

# OpenAI
export OPENAI_API_KEY=sk-sua-chave-aqui

# Ollama (local)
export OLLAMA_HOST=http://localhost:11434
```

### Onde definir

**Linux/macOS** — Adicione ao `~/.bashrc` ou `~/.zshrc`:

```bash
echo 'export ANTHROPIC_API_KEY=sk-ant-...' >> ~/.bashrc
source ~/.bashrc
```

**Windows** — Use o Prompt de Comando:

```cmd
setx ANTHROPIC_API_KEY "sk-ant-sua-chave-aqui"
```

Ou PowerShell:

```powershell
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "sk-ant-sua-chave-aqui", "User")
```

---

## Configuração de Provider Padrão

### Definir provider

```bash
coiote config set provider anthropic
coiote config set provider openai
coiote config set provider ollama
```

### Definir modelo

```bash
# Anthropic
coiote config set model claude-sonnet-4-20250514
coiote config set model claude-opus-4-20250514

# OpenAI
coiote config set model gpt-4-turbo
coiote config set model gpt-4o

# Ollama
coiote config set model llama3
coiote config set model codellama
```

---

## Arquivo coiote.config.md

O Coiote procura por um arquivo `coiote.config.md` no diretório atual para configurações específicas do projeto.

### Estrutura básica

```markdown
# Coiote — Configuração do Projeto

---

## Provider

- **Provider padrão:** anthropic
- **Modelo:** claude-sonnet-4-20250514

---

## Permissões

### Aprovação automática

- Leitura de arquivos
- Execução de testes
- Comandos de build

### Sempre confirmar

- Modificação de arquivos existentes
- Instalação de dependências
- Commits Git

---

## Comandos Permitidos

- pnpm test
- pnpm build
- pnpm lint
- pnpm dev
```

---

## Configurações Globais

### Ver configuração atual

```bash
coiote config show
```

### Definir configuração

```bash
# Provider
coiote config set provider anthropic

# Modelo
coiote config set model claude-sonnet-4-20250514

# Temperatura
coiote config set temperature 0.7

# Máximo de tokens
coiote config set maxTokens 4096
```

### Listar todas as configurações

```bash
coiote config list
```

---

## Variáveis de Ambiente

| Variável            | Descrição              | Obrigatório |
| ------------------- | ---------------------- | ----------- |
| `ANTHROPIC_API_KEY` | Chave da API Anthropic | Sim\*       |
| `OPENAI_API_KEY`    | Chave da API OpenAI    | Sim\*       |
| `OLLAMA_HOST`       | Host do Ollama         | Sim\*       |
| `COIOTE_MODEL`      | Modelo padrão          | Não         |
| `COIOTE_PROVIDER`   | Provider padrão        | Não         |
| `COIOTE_DIR`        | Diretório de dados     | Não         |

\*Pelo menos uma API key deve estar configurada.

---

## Configuração por Projeto

Você pode ter configurações específicas por projeto criando um arquivo `coiote.config.md` na raiz do projeto.

```bash
# Seu projeto
cd meu-projeto/
coiote config set provider openai
coiote "criar componente React"
```

---

## Modo Headless

Para CI/CD ou automação, use variáveis de ambiente:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export COIOTE_AUTO_APPROVE=true

coiote -y "executar testes"
```

---

## Segurança

### Arquivos nunca enviados ao LLM

O Coiote não inclui estes arquivos no contexto:

```
.env
.env.*
*.pem
*.key
*.p12
secrets/
```

### Nunca exponha chaves

```bash
# ERRADO
coiote "minha API key é $ANTHROPIC_API_KEY"

# CORRETO
# Use a variável diretamente, ela nunca é exibida
```

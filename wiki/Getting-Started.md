# Primeiros Passos

Este guia vai ajudá-lo a começar com o Coiote em poucos minutos.

---

## Pré-requisitos

- **Node.js** 20.0.0 ou superior
- **pnpm** (recomendado) ou npm
- **API Key** de um provedor suportado:
  - Anthropic (Claude) — recomendado
  - OpenAI (GPT-4)
  - Ollama (modelos locais)

---

## Instalação Rápida

### Via npx (sem instalação)

```bash
npx coiote "sua tarefa aqui"
```

### Via npm

```bash
npm install -g coiote
```

### Via pnpm (recomendado)

```bash
pnpm add -g coiote
```

---

## Configuração Inicial da API Key

### Variáveis de Ambiente

Defina sua API key como variável de ambiente:

```bash
# Anthropic (recomendado)
export ANTHROPIC_API_KEY=sk-ant-sua-chave-aqui

# OpenAI (alternativo)
export OPENAI_API_KEY=sk-sua-chave-aqui
```

Para persistir, adicione ao seu `~/.bashrc` ou `~/.zshrc`:

```bash
echo 'export ANTHROPIC_API_KEY=sk-ant-sua-chave-aqui' >> ~/.bashrc
source ~/.bashrc
```

### Configuração via Comando

```bash
# Definir provider padrão
coiote config set provider anthropic

# Definir modelo padrão
coiote config set model claude-sonnet-4-20250514
```

---

## Primeiro Uso

### Modo Interativo

```bash
coiote
```

Isso inicia o modo interativo onde você pode digitar suas tarefas.

### Execução Direta

```bash
coiote "criar um arquivo index.html com estrutura básica"
```

### Exemplo Completo

```bash
# 1. Configure a API key
export ANTHROPIC_API_KEY=sk-ant-...

# 2. Execute uma tarefa
coiote "listar arquivos do diretório src/"

# 3. O Coiote vai:
#    - Mostrar o plano de execução
#    - Listar os arquivos
#    - Pedir confirmação se necessário
```

---

## Verificação da Instalação

```bash
# Ver versão
coiote --version

# Ver configuração atual
coiote config show

# Ver estatísticas de uso
coiote data stats
```

---

## Próximos Passos

1. **[Installation](./Installation.md)** — Instalação detalhada
2. **[Configuration](./Configuration.md)** — Configurações avançadas
3. **[Usage](./Usage.md)** — Modos de uso
4. **[Commands](./Commands.md)** — Comandos disponíveis
5. **[Examples](./Examples.md)** — Exemplos práticos

---

## Dicas

- Use `-v` para modo verboso
- Use `-q` para modo silencioso
- Use `-y` para aprovação automática (headless)
- Crie arquivos de tarefas `.md` para automação

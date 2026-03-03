# Bem-vindo ao Coiote

![Coiote](https://img.shields.io/badge/status-em%20desenvolvimento-yellow?style=flat-square)
![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen?style=flat-square&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square&logo=typescript)
![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-green?style=flat-square)

O **Coiote** é um assistente de desenvolvimento guiado por IA que roda diretamente no seu terminal. Ele planeja, escreve, refatora e executa código — mas diferente de outros agentes, ele te conta tudo o que está fazendo **antes** de fazer.

---

## O que é o Coiote?

O Coiote é um assistente de desenvolvimento de software que roda na sua linha de comando. Você descreve o que quer em linguagem natural, e ele executa — lendo arquivos, editando código, rodando testes, fazendo commits.

> **O Coiote nunca age em silêncio.**
> Antes de tocar um arquivo, ele mostra o que vai fazer. Antes de rodar um comando, ele pede confirmação.

---

## Recursos Principais

### 🤖 Multi-Provider

Suporte a múltiplos provedores de LLM:

- **Anthropic** (Claude) — padrão
- **OpenAI** (GPT-4)
- **Ollama** (modelos locais)

### 🎨 TUI Rica

Interface de usuário em terminal com:

- Cores e formatação
- Barras de progresso
- Feedback em tempo real
- Exibição de diffs

### 🔄 Modo Headless

Execute tarefas em modo automatizado sem interação:

- Ideal para CI/CD
- Use flags como `-y` para aprovação automática
- Configure via arquivo de tarefas

### 📋 Confirmação Total

- Sempre mostra o plano antes de executar
- Exibe prévia das mudanças
- Pede confirmação para ações sensíveis
- Explica erros em português

---

## Links Rápidos

| Recurso                                 | Descrição            |
| --------------------------------------- | -------------------- |
| [Getting Started](./Getting-Started.md) | Primeiros passos     |
| [Installation](./Installation.md)       | Como instalar        |
| [Configuration](./Configuration.md)     | Configurar API keys  |
| [Usage](./Usage.md)                     | Como usar o Coiote   |
| [Commands](./Commands.md)               | Comandos disponíveis |
| [Examples](./Examples.md)               | Exemplos práticos    |
| [FAQ](./FAQ.md)                         | Perguntas frequentes |

---

## Instalação Rápida

```bash
# Via npx (sem instalação)
npx coiote "sua tarefa aqui"

# Via npm
npm install -g coiote

# Via pnpm
pnpm add -g coiote
```

---

## Primeiro Uso

```bash
# Configure sua API key (Anthropic)
export ANTHROPIC_API_KEY=sk-ant-...

# Execute uma tarefa
coiote "criar um componente React"
```

---

## Status do Projeto

| Badge      | Status               |
| ---------- | -------------------- |
| Versão     | 1.6                  |
| Fase       | 3 — Agência Completa |
| Node.js    | 20+                  |
| TypeScript | Strict               |

---

_Para mais informações, consulte a documentação completa ou execute `coiote --help`._

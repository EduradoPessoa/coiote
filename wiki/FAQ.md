# Perguntas Frequentes

Respostas para as dúvidas mais comuns sobre o Coiote.

---

## O que é o Coiote?

O Coiote é um assistente de desenvolvimento guiado por IA que roda no terminal. Ele ajuda você a escrever código, executar tarefas, refatorar código e muito mais — sempre mostrando o que vai fazer antes de fazer.

**Principais características:**

- Interface de terminal rica e colorida
- Explicação em português
- Confirmação antes de ações
- Suporte a múltiplos provedores de IA

---

## Quais modelos suporta?

O Coiote suporta os principais modelos de linguagem:

### Anthropic (padrão)

- Claude Sonnet 4 (padrão)
- Claude Opus 4
- Claude Haiku

### OpenAI

- GPT-4 Turbo
- GPT-4o
- GPT-3.5 Turbo

### Ollama (local)

- Llama 3
- Codellama
- Mistral
- Outros modelos locais

---

## É seguro usar?

**Sim, o Coiote é seguro.** Algumas considerações:

### Suas chaves de API nunca são expostas

- As chaves são usadas apenas para autenticação com os provedores
- Nunca são incluídas em logs ou saídas

### Arquivos sensíveis protegidos

O Coiote nunca envia ao LLM:

- Arquivos `.env` e variáveis de ambiente
- Chaves SSH e certificados
- Qualquer arquivo de credenciais

### Permissões configuráveis

- Você controla o que o Coiote pode fazer
- Pode definir aprovações automáticas ou manuais
- Sempre pede confirmação para ações sensíveis

---

## Como funciona sem internet?

### Modo Offline Parcial

O Coiote precisa de internet para:

- Comunicar com APIs de LLM (Anthropic, OpenAI)
- Baixar atualizações

O Coiote funciona offline para:

- Ler arquivos locais
- Executar comandos no seu sistema
- Acessar histórico salvo localmente

### Ollama (Alternativa Local)

Para uso sem internet, use o Ollama:

```bash
# Instalar Ollama
curl https://ollama.ai/install.sh | sh

# Iniciar Ollama
ollama serve

# Usar com Coiote
coiote config set provider ollama
coiote "sua tarefa"
```

---

## Custo de uso?

### Custos de API

O Coiote usa APIs de terceiros que têm custos próprios:

**Anthropic (Claude):**

- Entrada: ~$3/milhão de tokens
- Saída: ~$15/milhão de tokens

**OpenAI (GPT-4):**

- Entrada: ~$10/milhão de tokens
- Saída: ~$30/milhão de tokens

**Ollama (gratuito):**

- Uso local, sem custos de API

### Custos do Coiote

O Coiote é **open source e gratuito**.

---

## Como instalar?

```bash
# Via npm
npm install -g coiote

# Via pnpm (recomendado)
pnpm add -g coiote

# Via npx (sem instalação)
npx coiote "sua tarefa"
```

Requisitos: Node.js 20+

---

## Como configuro a API key?

```bash
# Anthropic (padrão)
export ANTHROPIC_API_KEY=sk-ant-sua-chave-aqui

# OpenAI
export OPENAI_API_KEY=sk-sua-chave-aqui
```

Adicione ao seu `.bashrc` ou `.zshrc` para persistir.

---

## Posso usar em produção?

O Coiote é uma ferramenta de **desenvolvimento**, não recomendada para:

- Sistemas em produção
- Código crítico de segurança
- Decisões automatizadas sem supervisão

Use sempre com supervisão e revise as mudanças antes de aplicar.

---

## O Coiote pode executar comandos perigosos?

**Não por padrão.** O Coiote:

- Nunca executa comandos como `sudo`, `rm -rf /`, etc.
- Pede confirmação para comandos destrutivos
- Você pode configurar permissões específicas

---

## Como funciona o sistema de confirmação?

1. **O Coiote mostra o plano** — O que vai fazer
2. **Você aprova ou rejeita** — Pode dizer não a qualquer passo
3. **O Coiote executa** — Mostrando progresso em tempo real
4. **Feedback claro** — Explica erros em português

Use `-y` para modo headless (aprovação automática).

---

## Onde salvo o histórico?

O histórico é salvo localmente em:

- **Linux/macOS:** `~/.coiote/`
- **Windows:** `%USERPROFILE%\.coiote\`

Use `coiote data stats` para ver estatísticas.

---

## Como obter ajuda?

```bash
# Ajuda geral
coiote --help

# Ajuda específica
coiote help config
coiote help history

# Ver documentação
# Explore a pasta wiki/
```

---

## Posso contribuir?

Sim! O Coiote é open source:

1. Fork o repositório
2. Crie uma branch
3. Faça suas alterações
4. Envie um PR

Veja `CONTRIBUTING.md` para guidelines.

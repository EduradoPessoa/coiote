<div align="center">

# 🐺 Coiote

### Assistente de desenvolvimento guiado por IA — direto no seu terminal

*Coiote planeja, escreve, refatora e executa código.  
Mas ao contrário de outros agentes, ele te conta tudo o que está fazendo — antes de fazer.*

<br>

[![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow?style=flat-square)](https://github.com/seu-usuario/coiote)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen?style=flat-square&logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-green?style=flat-square)](./LICENSE)
[![PRs Bem-vindos](https://img.shields.io/badge/PRs-bem--vindos-brightgreen?style=flat-square)](./CONTRIBUTING.md)

<br>

</div>

---

## O que é o Coiote?

O Coiote é um assistente de desenvolvimento de software que roda na sua linha de comando. Você descreve o que quer em linguagem natural, e ele planeja, escreve e executa — lendo arquivos, editando código, rodando testes, fazendo commits.

Não é mágica. É um agente com acesso ao seu projeto, conectado a um modelo de linguagem, e com um conjunto claro de ferramentas que ele pode usar.

Mas tem um detalhe que muda tudo:

> **O Coiote nunca age em silêncio.**

Antes de tocar um arquivo, ele mostra o que vai fazer. Antes de rodar um comando, ele pede confirmação. Quando algo falha, ele explica por quê — em português, sem stack trace cru. A qualquer momento você pode interromper, redirecionar ou simplesmente dizer não.

---

## Por que mais um CLI agent?

Usamos vários agentes de código existentes e todos tinham o mesmo problema: **a comunicação com o usuário é opaca**. Você manda um prompt, o cursor pisca, e por minutos você não sabe:

- O que o agente está planejando fazer
- Quais arquivos serão modificados
- Por que ele tomou aquela decisão
- Se algo deu errado e por quê
- Quando ele precisa de você

Essa opacidade gera desconfiança. E desconfiança nos faz não usar a ferramenta com todo o potencial.

O Coiote é nossa tentativa de construir um agente que você *entende enquanto ele trabalha*. Não é sobre ser o mais poderoso. É sobre ser o mais legível.

---

## Como parece na prática

```
❯ coiote "adicione autenticação JWT ao endpoint /api/users"

📋 PLANO DE EXECUÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Entendi: Implementar autenticação JWT em /api/users

 Vou executar os seguintes passos:
  1. Ler o arquivo de rotas para entender a estrutura atual
  2. Ler o middleware existente para evitar duplicação
  3. Instalar dependência: jsonwebtoken
  4. Criar middleware de autenticação JWT
  5. Aplicar middleware na rota /api/users
  6. Escrever testes básicos
  7. Executar testes para validar

 Arquivos que podem ser modificados:
  • src/routes/users.js
  • src/middleware/auth.js  (novo)
  • package.json

 Continuar? [S/n]
```

```
⚡ EXECUTANDO PASSO 4/7
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Criando arquivo: src/middleware/auth.js

   PRÉVIA:
   ┌───────────────────────────────────────────────┐
   │ + const jwt = require('jsonwebtoken');        │
   │ +                                             │
   │ + const authMiddleware = (req, res, next) => {│
   │ +   // validar token JWT no header            │
   │ + };                                          │
   │ +                                             │
   │ + module.exports = authMiddleware;            │
   └───────────────────────────────────────────────┘

 Criar este arquivo? [S/n]
```

```
🎉 TAREFA CONCLUÍDA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ✅ src/middleware/auth.js   (criado, 34 linhas)
 ✅ src/routes/users.js     (modificado, +3 linhas)
 ✅ package.json            (jsonwebtoken adicionado)
 ✅ 4 testes passaram

 Commit criado: feat(auth): add JWT middleware to /api/users
 Tempo: 43s  |  Tokens: ~2.400
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Princípios que guiam o projeto

Estes não são marketing. São as decisões concretas que tomamos (e que você vai ver no código):

**Transparência radical** — Se o agente vai esperar mais de 2 segundos, ele te conta o que está fazendo. Sem cursor piscando no vazio.

**Controle sempre com você** — Ações irreversíveis exigem confirmação por texto digitado. O modo `--auto` existe, mas não desativa proteções para deleções.

**Erros explicados, não despejados** — Quando algo falha, você vê: o que falhou, por que falhou, o que já foi tentado, e quais são as opções agora. Não um stack trace cru.

**Zero magia negra** — Tudo que o Coiote faz pode ser auditado no log, revertido via git, e explicado linha por linha.

**Dados locais** — Nenhum dado seu vai para um servidor nosso. O histórico de sessões fica no SQLite da sua máquina. Só o código que você autoriza vai para a API do LLM.

---

## Funcionalidades

> ⚠️ O Coiote está em desenvolvimento ativo. A lista abaixo mistura o que já existe e o que está planejado — cada item indica seu estado.

| Funcionalidade | Status |
|----------------|--------|
| Loop agêntico com plano antes de executar | 🔨 Em desenvolvimento |
| Preview de arquivos antes de escrever (diff) | 🔨 Em desenvolvimento |
| Sistema de permissões em 3 camadas | 🔨 Em desenvolvimento |
| Erros com contexto humano e opções de recuperação | 🔨 Em desenvolvimento |
| Integração com Claude (Anthropic) | 🔨 Em desenvolvimento |
| Ferramentas de filesystem, shell e git | 🔨 Em desenvolvimento |
| Histórico de sessões local (SQLite) | 📅 Fase 2 |
| Leitura automática do `coiote.config.md` | 📅 Fase 2 |
| Integração com git (commit, diff, branch) | 📅 Fase 2 |
| Suporte a OpenAI e modelos Ollama locais | 📅 Fase 3 |
| Modo headless para CI/CD | 📅 Fase 3 |
| Slash commands no REPL (`/test`, `/commit`) | 📅 Fase 3 |
| Suporte a MCP servers | 📅 Fase 3 |
| TUI rica com syntax highlighting | 📅 Fase 4 |
| Publicação via `npx coiote` | 📅 Fase 4 |

---

## Instalação

> O Coiote ainda não está publicado no npm. Para usar, você precisará clonar e compilar localmente.

**Pré-requisitos:**
- Node.js 20 ou superior
- pnpm (`npm install -g pnpm`)
- Uma chave de API da Anthropic

```bash
# 1. Clonar o repositório
git clone https://github.com/seu-usuario/coiote.git
cd coiote

# 2. Instalar dependências
pnpm install

# 3. Compilar
pnpm build

# 4. Configurar sua chave de API
node dist/index.js config set-key anthropic

# 5. Usar
node dist/index.js "crie um README para este projeto"
```

Após a v1.0, será possível usar sem instalação:

```bash
npx coiote "sua tarefa aqui"
```

---

## Configuração

O Coiote é configurado por projeto através do arquivo `coiote.config.md` na raiz do seu projeto. Ele define contexto, permissões, comandos e convenções:

```markdown
# Coiote — Configuração do Projeto

## Contexto do Projeto
API REST em Node.js + TypeScript com PostgreSQL.

## Comandos
- Testes: `npm test`
- Build: `npm run build`

## Convenções
- TypeScript strict
- Commits em Conventional Commits

## Permissões
### Aprovação automática
- Leitura de qualquer arquivo
- Execução de: npm test, npm build

### Sempre confirmar
- Modificação de arquivos em src/core/

### Nunca fazer
- Modificar arquivos .env
```

O Coiote lê este arquivo automaticamente no início de cada sessão. Sem este arquivo, ele opera com permissões padrão.

---

## Stack tecnológica

O Coiote é construído com TypeScript sobre Node.js 20+. As escolhas foram feitas para maximizar confiabilidade e facilidade de contribuição:

- **[ink](https://github.com/vadimdemedes/ink)** — React no terminal para a interface
- **[@anthropic-ai/sdk](https://github.com/anthropic-ai/sdk-node)** — Integração com Claude
- **[execa](https://github.com/sindresorhus/execa)** — Execução de comandos shell com controle total
- **[simple-git](https://github.com/steveukx/git-js)** — Integração programática com Git
- **[better-sqlite3](https://github.com/WiseLibs/better-sqlite3)** — Histórico local de sessões
- **[vitest](https://vitest.dev)** — Testes unitários e de integração

Veja a especificação completa em [`docs/coiote-stack.md`](./docs/coiote-stack.md).

---

## Estrutura do projeto

```
coiote/
├── coiote.config.md          # Configuração operacional do projeto
├── src/
│   ├── agent/                # Loop agêntico principal
│   ├── providers/            # Integrações com LLMs (Anthropic, OpenAI, Ollama)
│   ├── tools/                # Ferramentas: filesystem, shell, git
│   ├── ui/                   # Interface e sistema de comunicação (Reporter)
│   ├── permissions/          # Sistema de permissões em 3 camadas
│   ├── persistence/          # SQLite — histórico de sessões
│   ├── security/             # Validações: path, command, injection
│   └── config/               # Configurações globais e de projeto
├── test/
│   ├── unit/                 # Testes por módulo
│   ├── integration/          # Testes fim-a-fim com LLM mockado
│   └── fixtures/             # Projetos fictícios para testes
└── docs/
    ├── coiote-prd.md         # Visão, filosofia e UX de comunicação
    ├── coiote-stack.md       # Stack tecnológica e decisões arquiteturais
    ├── coiote-development.md # Guia de desenvolvimento e boas práticas
    ├── coiote-data.md        # Schema de dados e persistência
    ├── coiote-security.md    # Modelo de ameaças e controles
    ├── coiote-orchestrator.md# Roadmap detalhado por fases
    └── agents/               # Perfis de agentes especializados
```

---

## Contribuindo

O Coiote é um projeto jovem e a sua participação faz diferença de verdade — não só com código. Há muito espaço para contribuir:

**Com código:**
- Implementar tools que ainda não existem (`edit_file`, `run_tests`, as tools de git)
- Escrever testes para os módulos existentes
- Implementar providers alternativos (OpenAI, Ollama)
- Melhorar os componentes de TUI

**Sem código:**
- Testar e reportar bugs
- Sugerir melhorias na UX de comunicação (o diferencial do projeto)
- Melhorar a documentação
- Propor casos de uso que o Coiote deveria suportar

**Para começar:**

```bash
# Fork e clone
git clone https://github.com/seu-usuario/coiote.git
cd coiote
pnpm install

# Rode os testes para garantir que está tudo funcionando
pnpm test

# Crie uma branch para sua contribuição
git checkout -b feat/nome-da-sua-contribuicao
```

Leia o [`CONTRIBUTING.md`](./CONTRIBUTING.md) para o guia completo — incluindo convenções de commit, como rodar os testes e como a revisão de código funciona.

Se você está em dúvida por onde começar, procure issues com a label [`good first issue`](https://github.com/EduardoPessoa/coiote/issues?q=label%3A%22good+first+issue%22). São tarefas bem delimitadas, com contexto suficiente para uma primeira contribuição.

**Tem uma ideia mas não quer codificar?** Abre uma issue. Conversamos.

---

## Roadmap

O desenvolvimento está dividido em 4 fases:

```
Fase 1 — MVP Funcional         (semanas 1–4)   🔨 em andamento
  Loop básico, tools de filesystem e shell,
  sistema de comunicação, permissões

Fase 2 — Context Awareness     (semanas 5–8)   📅 planejado
  Git integration, leitura de coiote.config.md,
  histórico de sessões, compactação de contexto

Fase 3 — Agência Completa      (semanas 9–14)  📅 planejado
  Multi-provider, modo headless, MCP servers,
  slash commands, uso em CI/CD

Fase 4 — Polimento             (semanas 15–20) 📅 planejado
  TUI rica, syntax highlighting, publicação npm
```

O plano detalhado com tarefas semana a semana está em [`docs/coiote-orchestrator.md`](./docs/coiote-orchestrator.md).

---

## Segurança

O Coiote lida com código e executa comandos — isso merece atenção:

- Chaves de API são armazenadas no Keychain do sistema operacional, nunca em texto puro
- Arquivos `.env` e credenciais nunca são enviados à API do LLM
- Todo comando shell passa por validação antes de executar
- Ações irreversíveis (deleção, `git reset --hard`) exigem confirmação por texto digitado
- Detecção de prompt injection em arquivos antes de incluí-los no contexto

Para mais detalhes, veja [`docs/coiote-security.md`](./docs/coiote-security.md).

Para reportar uma vulnerabilidade, não abra uma issue pública — use os [GitHub Security Advisories](https://github.com/EduardoPessoa/coiote/security/advisories).

---

## Perguntas frequentes

**O Coiote funciona com qualquer projeto?**  
Sim. Ele lê a estrutura do seu projeto e adapta o comportamento. Se você criar um `coiote.config.md`, ele vai seguir as convenções que você definiu. Sem o arquivo, opera com padrões razoáveis.

**Meu código vai para algum servidor de vocês?**  
Não. O Coiote roda localmente e fala diretamente com a API do LLM que você configurou (Anthropic, OpenAI, ou um modelo local via Ollama). Nenhum dado passa por infraestrutura nossa.

**Funciona sem internet?**  
Para modelos locais via Ollama, sim. Para Claude e GPT-4, você precisa de conexão com as respectivas APIs.

**Qual modelo de linguagem é usado?**  
Por padrão, Claude Sonnet da Anthropic. Mas a arquitetura é multi-provider — você poderá usar OpenAI, Gemini ou modelos Ollama locais (Fase 3 do roadmap).

**Posso usar em CI/CD?**  
Isso está no plano para a Fase 3, com um modo `--headless` que opera sem prompts interativos e retorna exit codes semânticos.

---

## Licença

Este projeto é distribuído sob a licença MIT. Veja o arquivo [`LICENSE`](./LICENSE) para o texto completo.

Em resumo: você pode usar, copiar, modificar, distribuir e sublicenciar este software — inclusive para fins comerciais — desde que mantenha o aviso de copyright.

```
MIT License

Copyright (c) 2026 Projeto Coiote

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Agradecimentos

O Coiote existe porque a comunidade de código aberto já construiu coisas incríveis das quais nos apoiamos. Obrigado a todos os mantenedores das bibliotecas que usamos, e especialmente aos projetos [Aider](https://github.com/paul-gauthier/aider) e [Cline](https://github.com/cline/cline), que mostraram que CLI agents podem ser ferramentas sérias de desenvolvimento.

---

<div align="center">

Feito com cuidado por pessoas que se frustram com caixas-pretas.  
Se você também se frustra, **o Coiote é seu projeto tanto quanto nosso**.

[⭐ Star no GitHub](https://github.com/EduardoPessoa/coiote) · [🐛 Reportar Bug](https://github.com/EduardoPessoa/coiote/issues) · [💡 Sugerir Feature](https://github.com/EduardoPessoa/coiote/issues) · [💬 Discussões](https://github.com/EduardoPessoa/coiote/discussions)

</div>

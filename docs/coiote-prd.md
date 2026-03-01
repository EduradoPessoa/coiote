# 🐺 Coiote — Assistente de Desenvolvimento Guiado por IA em Linha de Comando

> **Versão do documento:** 0.1 (rascunho inicial)
> **Status do projeto:** Planejamento
> **Objetivo:** Definir arquitetura, princípios e padrões de comunicação do Coiote

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Filosofia do Projeto](#2-filosofia-do-projeto)
3. [Arquitetura do Sistema](#3-arquitetura-do-sistema)
4. [⭐ Sistema de Comunicação com o Usuário](#4-sistema-de-comunicação-com-o-usuário)
5. [Ferramentas do Agente (Tools)](#5-ferramentas-do-agente-tools)
6. [Sistema de Permissões](#6-sistema-de-permissões)
7. [Configuração de Projeto](#7-configuração-de-projeto)
8. [Stack Tecnológica](#8-stack-tecnológica)
9. [Roadmap de Desenvolvimento](#9-roadmap-de-desenvolvimento)
10. [Glossário](#10-glossário)

---

## 1. Visão Geral

O **Coiote** é um assistente de desenvolvimento de software que roda inteiramente na linha de comando. Ele usa modelos de linguagem de grande escala (LLMs) para planejar, escrever, corrigir e executar código de forma autônoma — mas sempre mantendo o desenvolvedor completamente informado e no controle.

### O problema que o Coiote resolve

A maioria dos agentes de código CLI existentes falham em um ponto crítico: **a comunicação com o usuário é opaca**. O desenvolvedor envia um prompt e, por longos segundos (ou minutos), não sabe:

- O que o agente está planejando fazer
- Quais arquivos serão tocados
- Por que uma decisão foi tomada
- Se algo deu errado e o porquê
- Quando é necessária sua intervenção

O Coiote resolve isso com um **sistema de comunicação radical e transparente** — cada intenção, ação, resultado e decisão é comunicada de forma clara, em tempo real, antes de acontecer.

---

## 2. Filosofia do Projeto

### Princípios fundamentais

**1. Transparência Radical**
O usuário nunca deve ficar olhando para um cursor piscando sem saber o que está acontecendo. Cada ação tem uma intenção visível, cada decisão tem uma justificativa legível.

**2. Controle Sempre com o Humano**
O Coiote nunca executa ações irreversíveis sem confirmação explícita do usuário. O agente é poderoso, mas a autonomia tem limites claramente definidos.

**3. Progressivo e Interrompível**
Toda execução longa pode ser pausada ou cancelada. O usuário pode intervir a qualquer momento sem perder o progresso.

**4. Erros são Oportunidades de Aprendizado**
Quando algo falha, o Coiote explica o que aconteceu em linguagem humana, o que tentou e por que não funcionou — não apenas um stack trace cru.

**5. Zero Magia Negra**
Nenhuma ação acontece "por debaixo dos panos". Tudo que o Coiote faz pode ser auditado no log, revertido via git, e explicado de forma didática.

---

## 3. Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────┐
│                    COIOTE CLI                       │
│                                                     │
│  ┌──────────┐    ┌──────────────┐    ┌───────────┐  │
│  │  REPL /  │───▶│    AGENTE    │───▶│   MODEL   │  │
│  │   TUI    │    │ Orquestrador │    │  (LLM API)│  │
│  └──────────┘    └──────┬───────┘    └───────────┘  │
│       ▲                 │                           │
│       │           ┌─────▼──────┐                   │
│       │           │  TOOL LOOP │                   │
│       │           └─────┬──────┘                   │
│       │                 │                           │
│  ┌────┴────────────────▼────────────────────────┐  │
│  │              CAMADA DE COMUNICAÇÃO            │  │
│  │  (Reporter / Event Bus / Progress Manager)    │  │
│  └────────────────────────────────────────────┬─┘  │
│                                               │     │
│  ┌─────────────┐  ┌──────────┐  ┌────────────▼─┐  │
│  │ File System │  │  Shell   │  │  Git Manager │  │
│  │   Tools     │  │ Executor │  │              │  │
│  └─────────────┘  └──────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Loop Agêntico Principal

```
Usuário envia prompt
        │
        ▼
  [PLANEJAR] ──────── Exibe plano para o usuário
        │
        ▼
  [EXECUTAR] ──────── Exibe cada ação em tempo real
        │
   loop até concluir
        │
        ▼
  [VERIFICAR] ─────── Exibe resultados e confirma sucesso
        │
        ▼
  [REPORTAR] ──────── Resumo final com o que foi feito
```

---

## 4. ⭐ Sistema de Comunicação com o Usuário

> Esta é a seção mais crítica do projeto. A qualidade da comunicação com o usuário é o principal diferencial do Coiote em relação aos concorrentes.

### 4.1 Princípio Básico: Nunca Deixe o Usuário no Escuro

**Regra de ouro:** Se o usuário ficará esperando por mais de 2 segundos, ele deve receber uma mensagem explicando o que está acontecendo.

### 4.2 Anatomia de uma Resposta Coiote

Cada ciclo de operação tem quatro fases de comunicação obrigatórias:

```
┌─────────────────────────────────────────────┐
│  FASE 1: INTENÇÃO (antes de agir)           │
│  O que vou fazer e por quê                  │
├─────────────────────────────────────────────┤
│  FASE 2: EXECUÇÃO (durante a ação)          │
│  O que está acontecendo agora               │
├─────────────────────────────────────────────┤
│  FASE 3: RESULTADO (após a ação)            │
│  O que aconteceu, funcionou ou falhou       │
├─────────────────────────────────────────────┤
│  FASE 4: PRÓXIMO PASSO (transição)          │
│  O que vem a seguir                         │
└─────────────────────────────────────────────┘
```

### 4.3 Hierarquia de Mensagens

O Coiote usa um sistema de tipos de mensagem com prefixos visuais padronizados:

| Tipo | Ícone | Cor | Quando usar |
|------|-------|-----|-------------|
| **PLAN** | `📋` | Azul | Exibir o plano de execução antes de iniciar |
| **ACTION** | `⚡` | Ciano | Indicar uma ação que está prestes a ocorrer |
| **TOOL** | `🔧` | Amarelo | Chamada de ferramenta (leitura/escrita de arquivo, shell) |
| **PROGRESS** | `⏳` | Branco | Atualização de progresso em operações longas |
| **SUCCESS** | `✅` | Verde | Ação concluída com sucesso |
| **WARNING** | `⚠️` | Amarelo | Situação inesperada, mas não fatal |
| **ERROR** | `❌` | Vermelho | Falha com descrição completa |
| **ASK** | `❓` | Magenta | Pedido de confirmação ou informação ao usuário |
| **INFO** | `ℹ️` | Branco dim | Informação contextual, não requer ação |
| **DONE** | `🎉` | Verde brilhante | Resumo final de tarefa concluída |

### 4.4 Padrões de Mensagens por Situação

#### ✅ Início de Tarefa — Sempre exibir o plano

```
❯ coiote "adicione autenticação JWT ao endpoint /api/users"

📋 PLANO DE EXECUÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Entendi: Implementar autenticação JWT no endpoint /api/users

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
  • src/middleware/ (criação de auth.js)
  • package.json

 Continuar? [S/n] _
```

**Regras para o bloco PLANO:**
- Sempre listar todos os passos antes de executar qualquer um
- Sempre listar arquivos que serão modificados
- Sempre pedir confirmação antes de iniciar (a menos que `--auto` esteja ativo)
- Usar linguagem natural e direta, não jargão técnico

---

#### ⚡ Durante a Execução — Progresso em tempo real

```
⚡ EXECUTANDO PASSO 1/7
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Lendo arquivo: src/routes/users.js
   → 127 linhas encontradas
   → Identificado: Express Router com 3 endpoints
   
🔧 Lendo arquivo: src/middleware/index.js
   → 45 linhas encontradas
   → Identificado: cors, helmet, e morgan já configurados

✅ Contexto carregado. Prosseguindo com o plano.

⚡ EXECUTANDO PASSO 3/7
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Instalando dependência: jsonwebtoken@9.0.0
   $ npm install jsonwebtoken
   ⏳ Aguardando npm...
   ✅ jsonwebtoken instalado com sucesso
```

**Regras para mensagens de execução:**
- Mostrar o número do passo atual e o total (ex: "3/7")
- Para cada ferramenta ativada, mostrar o nome do arquivo ou comando
- Para comandos shell, mostrar o comando exato que será executado
- Mostrar resultado imediatamente após a ação (✅ ou ❌)
- Nunca suprimir saídas de erro — sempre mostrá-las

---

#### 🔧 Escrita de Arquivos — Mostrar o diff

```
⚡ EXECUTANDO PASSO 4/7
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Criando arquivo: src/middleware/auth.js

   PRÉVIA DO ARQUIVO:
   ┌─────────────────────────────────────────┐
   │ + const jwt = require('jsonwebtoken');  │
   │ +                                       │
   │ + const authMiddleware = (req, res, ...) => { │
   │ +   // validar token JWT no header      │
   │ + };                                    │
   │ +                                       │
   │ + module.exports = authMiddleware;      │
   └─────────────────────────────────────────┘

 Criar este arquivo? [S/n] _
```

**Regras para escrita de arquivos:**
- Sempre mostrar um diff ou prévia antes de criar/modificar arquivos
- Para arquivos novos: mostrar o conteúdo completo (ou resumo para arquivos grandes)
- Para modificações: mostrar apenas as linhas alteradas em formato diff (+/-)
- Pedir confirmação para cada arquivo, a menos que `--auto` esteja ativo
- Indicar se o arquivo já existe e será sobrescrito

---

#### ❌ Tratamento de Erros — Nunca apenas "falhou"

```
❌ ERRO NO PASSO 5/7
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 O quê falhou: Não foi possível aplicar o middleware na rota.

 Por que falhou:
 O arquivo src/routes/users.js usa uma estrutura modular diferente
 da esperada. O router é exportado como função (factory pattern),
 não como instância direta.

 Saída do erro:
 ┌────────────────────────────────────────┐
 │ TypeError: Cannot read property 'use'  │
 │ of undefined at users.js:12            │
 └────────────────────────────────────────┘

 O que tentei:
  • Injetar middleware via router.use() → falhou (estrutura incompatível)
  • Aplicar diretamente na rota → não foi tentado ainda

 Opções:
  [1] Tentar estratégia alternativa (aplicar via express app diretamente)
  [2] Me mostrar o arquivo para eu decidir como prosseguir
  [3] Abortar esta tarefa

 O que prefere? [1/2/3] _
```

**Regras para mensagens de erro:**
- NUNCA exibir apenas o stack trace cru sem contexto
- Sempre explicar em linguagem humana: o que falhou e por quê
- Sempre mostrar o que foi tentado antes do erro
- Sempre oferecer opções de recuperação — nunca apenas parar
- Distinguir erros recuperáveis de erros fatais

---

#### ⚠️ Situações de Atenção — Warnings proativos

```
⚠️  ATENÇÃO ANTES DE CONTINUAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Identificamos que o arquivo package.json já possui
 uma versão diferente de jsonwebtoken: ^8.5.1

 Vou instalar a versão 9.0.0, o que pode causar
 incompatibilidades com código existente.

 Recomendação: verificar o changelog antes de atualizar.
 https://github.com/auth0/node-jsonwebtoken/releases

 Continuar mesmo assim? [s/N] _
```

**Regras para warnings:**
- Avisar ANTES de ações que podem ter consequências inesperadas
- Sempre incluir contexto: por que isso pode ser um problema
- Sempre dar uma recomendação de ação
- Warnings sobre dados: backup, versões, sobrescrita de arquivos
- Warnings sobre segurança: chaves expostas, permissões, dados sensíveis

---

#### 🎉 Conclusão — Resumo completo do que foi feito

```
🎉 TAREFA CONCLUÍDA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Autenticação JWT implementada com sucesso.

 O que foi feito:
  ✅ src/middleware/auth.js         (novo arquivo, 34 linhas)
  ✅ src/routes/users.js           (modificado, +3 linhas)
  ✅ package.json                  (jsonwebtoken 9.0.0 adicionado)
  ✅ test/auth.test.js             (novo arquivo, 28 linhas)

 Resultados dos testes:
  ✅ 4 testes passaram
  ⚠️  1 teste ignorado (requer banco de dados)

 Commit criado: feat(auth): add JWT middleware to /api/users
 Branch: main | Hash: a3f9c21

 Tempo total: 43 segundos | Tokens utilizados: ~2.400

 Para testar manualmente:
  $ curl -H "Authorization: Bearer <token>" http://localhost:3000/api/users
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Regras para o resumo final:**
- Sempre listar todos os arquivos tocados com o tipo de modificação
- Incluir resultados de testes se foram executados
- Informar sobre commits criados
- Mostrar estatísticas úteis (tempo, tokens)
- Oferecer um próximo passo ou comando de teste

---

### 4.5 Modo Verbose e Modo Silencioso

O Coiote deve suportar três níveis de verbosidade:

| Modo | Flag | Comportamento |
|------|------|--------------|
| **Padrão** | _(sem flag)_ | Exibe plano, confirmações, ações e resumo |
| **Verbose** | `--verbose` ou `-v` | Exibe tudo, incluindo raciocínio interno do LLM |
| **Silencioso** | `--quiet` ou `-q` | Exibe apenas erros e o resumo final |
| **Automático** | `--auto` ou `-y` | Confirma todas as ações automaticamente (sem prompts) |

### 4.6 Indicadores de Progresso para Operações Longas

Para qualquer operação que leve mais de 2 segundos:

```
⏳ Analisando codebase...
   [████████████░░░░░░░░] 60% — 24 arquivos lidos de 40
```

Para chamadas à API do LLM (pensando):

```
🧠 Coiote está pensando...  ⠸  (12s)
```

Para comandos shell longos:

```
⏳ Rodando npm install...
   $ npm install (aguardando...)
   ↳ stdout: added 3 packages in 8s
```

**Regras para progresso:**
- Para operações de arquivo: mostrar progresso com contador (ex: 24/40)
- Para chamadas LLM: mostrar spinner animado com tempo decorrido
- Para comandos: mostrar stdout em tempo real (não bufferizado)
- Nunca bloquear o terminal sem nenhuma saída por mais de 3 segundos

---

### 4.7 Padrão de Comunicação para Operações Perigosas

Operações que podem causar dano irreversível exigem confirmação reforçada:

```
⚠️  AÇÃO IRREVERSÍVEL DETECTADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Estou prestes a DELETAR os seguintes arquivos:

  🗑️  src/legacy/old-api.js      (843 linhas)
  🗑️  src/legacy/deprecated.js   (221 linhas)
  🗑️  tests/legacy/              (diretório com 8 arquivos)

 Esta ação NÃO PODE SER DESFEITA pelo Coiote após executada.
 (Mas poderá ser recuperada via git se você tiver commits)

 Para confirmar, digite: DELETAR
 Para cancelar, pressione Enter ou Ctrl+C

 > _
```

**Regras para ações irreversíveis:**
- Sempre listar exatamente o que será afetado
- Requerer confirmação por texto digitado (não apenas Enter)
- Informar se existe forma de recuperação (git, backup)
- NÃO é possível desativar esta confirmação com `--auto` para ações destrutivas

---

## 5. Ferramentas do Agente (Tools)

O Coiote disponibiliza um conjunto de ferramentas que o LLM pode invocar. Cada ferramenta tem uma interface clara com o usuário:

### Ferramentas de Sistema de Arquivos

| Ferramenta | Descrição | Requer confirmação? |
|------------|-----------|---------------------|
| `read_file(path)` | Lê o conteúdo de um arquivo | Não |
| `write_file(path, content)` | Cria ou sobrescreve um arquivo | **Sim** |
| `edit_file(path, diff)` | Aplica mudanças pontuais em um arquivo | **Sim** |
| `delete_file(path)` | Remove um arquivo | **Sim (irreversível)** |
| `list_files(path, pattern)` | Lista arquivos em um diretório | Não |
| `search_in_files(query, pattern)` | Busca texto em arquivos (ripgrep) | Não |

### Ferramentas de Shell

| Ferramenta | Descrição | Requer confirmação? |
|------------|-----------|---------------------|
| `run_command(cmd)` | Executa comando no shell | **Sim** |
| `run_tests(cmd)` | Executa suite de testes | Sim (configurável) |
| `install_package(name)` | Instala dependência via npm/pip | **Sim** |

### Ferramentas de Git

| Ferramenta | Descrição | Requer confirmação? |
|------------|-----------|---------------------|
| `git_status()` | Exibe status do repositório | Não |
| `git_diff(files)` | Mostra diferenças entre versões | Não |
| `git_commit(message)` | Cria um commit com os arquivos alterados | Sim (configurável) |
| `git_branch(name)` | Cria ou troca de branch | Sim |

---

## 6. Sistema de Permissões

O Coiote usa um sistema de permissões em três camadas:

### Camada 1: Aprovação por Sessão

No início de cada sessão, o usuário pode configurar o nível de autonomia:

```
Como você quer que eu opere nesta sessão?

[1] Perguntar antes de cada ação (mais seguro)
[2] Perguntar apenas para mudanças destrutivas (recomendado)
[3] Modo automático — executar tudo sem confirmação (use com cuidado)

> _
```

### Camada 2: Aprovação por Tipo de Ação

Independentemente da configuração de sessão, certas ações sempre requerem confirmação:

- Deleção de arquivos
- Execução de comandos com `sudo`
- Publicação / deploy
- Acesso a variáveis de ambiente ou arquivos `.env`
- Modificação de `package.json`, `Makefile`, `Dockerfile`

### Camada 3: Arquivo de Configuração do Projeto

O arquivo `coiote.config.md` na raiz do projeto pode definir regras permanentes:

```markdown
## Permissões Coiote

### Aprovação automática:
- Leitura de qualquer arquivo
- Execução de: npm test, npm build, pytest

### Sempre confirmar:
- Modificação de arquivos em: src/core/
- Qualquer comando envolvendo: production, deploy, publish

### Nunca fazer:
- Modificar arquivos .env
- Executar comandos com rm -rf
```

---

## 7. Configuração de Projeto

### Arquivo `coiote.config.md`

Similar ao `CLAUDE.md`, o arquivo `coiote.config.md` é lido automaticamente no início de cada sessão. Ele deve conter:

```markdown
# Coiote — Configurações do Projeto

## Contexto do Projeto
Aplicação Node.js com Express e PostgreSQL.
Usamos TypeScript. Sempre gere código tipado.

## Comandos Úteis
- Testes: `npm test`
- Build: `npm run build`
- Lint: `npm run lint`

## Convenções
- Commits em português no padrão Conventional Commits
- Funções nomeadas em camelCase
- Arquivos de módulo em kebab-case

## Permissões
- Auto-commit após cada tarefa concluída: sim
- Perguntar antes de instalar pacotes: sim
```

---

## 8. Stack Tecnológica

### Runtime e Linguagem

- **Linguagem:** TypeScript (Node.js 20+)
- **Runtime:** Node.js 20 LTS
- **Gerenciador de pacotes:** npm / pnpm

### Interface de Usuário (TUI)

- **`ink`** — React no terminal (componentes reutilizáveis, animações, cores)
- **`chalk`** — Cores e estilos de texto
- **`cli-spinners`** — Indicadores de progresso animados
- **`cli-table3`** — Tabelas formatadas no terminal
- **`diff`** — Geração de diffs legíveis para preview de arquivos

### Integração com LLM

- **`@anthropic-ai/sdk`** — SDK oficial do Claude
- **Modelos suportados:** Claude Sonnet (padrão), Claude Opus (tarefas complexas)
- Suporte planejado: OpenAI, Gemini, modelos locais via Ollama

### Ferramentas do Agente

- **`simple-git`** — Integração com Git
- **`glob`** — Busca de arquivos por padrão
- **`execa`** — Execução de comandos shell com streams
- **`ripgrep`** (binário externo) — Busca de texto em arquivos

### Desenvolvimento

- **`vitest`** — Testes unitários
- **`tsup`** — Build e empacotamento
- **`changesets`** — Versionamento semântico

---

## 9. Roadmap de Desenvolvimento

### Fase 1 — MVP (Semanas 1–4)
```
[ ] Estrutura base do projeto (TypeScript + Node.js)
[ ] REPL básico com entrada de texto
[ ] Integração com Anthropic API (tool use)
[ ] Ferramentas: read_file, write_file, run_command
[ ] Sistema de comunicação básico (plano + progresso + resumo)
[ ] Sistema de permissões simples (perguntar antes de cada ação)
[ ] Testes unitários para as ferramentas
```

### Fase 2 — Context Awareness (Semanas 5–8)
```
[ ] Leitura automática do coiote.config.md
[ ] Context loading do codebase no início da sessão
[ ] Git integration (status, diff, commit)
[ ] Compactação de contexto para conversas longas
[ ] Modo verbose com raciocínio do LLM visível
[ ] Histórico de sessão persistido
```

### Fase 3 — Agência Completa (Semanas 9–14)
```
[ ] Loop agêntico com verificação de resultados
[ ] Recuperação automática de erros comuns
[ ] Suporte a múltiplos LLMs (OpenAI, Gemini, Ollama)
[ ] Suporte a MCP servers
[ ] Slash commands customizados (/test, /commit, /explain)
[ ] Modo headless para uso em CI/CD
```

### Fase 4 — Polimento (Semanas 15–20)
```
[ ] TUI completa com ink (componentes visuais ricos)
[ ] Syntax highlighting inline (código no terminal)
[ ] Dashboard de uso e custos por sessão
[ ] Plugin system para ferramentas customizadas
[ ] Documentação pública e exemplos
[ ] Distribuição via npm (npx coiote)
```

---

## 10. Glossário

| Termo | Definição |
|-------|-----------|
| **Agente** | O Coiote operando autonomamente em um loop de plan → execute → verify |
| **Tool** | Ferramenta que o LLM pode chamar (ex: `write_file`, `run_command`) |
| **Tool Loop** | Ciclo onde o LLM chama tools, recebe resultados e decide o próximo passo |
| **Context Window** | Limite de tokens que o LLM pode processar em uma única chamada |
| **Context Compaction** | Técnica de resumir o histórico para não exceder o context window |
| **MCP** | Model Context Protocol — padrão para integração de ferramentas externas |
| **REPL** | Read-Eval-Print Loop — interface interativa de linha de comando |
| **TUI** | Terminal User Interface — interface gráfica dentro do terminal |
| **coiote.config.md** | Arquivo de configuração do Coiote por projeto, lido a cada sessão |
| **Modo Automático** | Modo onde o Coiote executa sem pedir confirmações (flag `--auto`) |

---

*Documentação mantida pelo time do projeto Coiote. Atualize este arquivo a cada mudança arquitetural significativa.*

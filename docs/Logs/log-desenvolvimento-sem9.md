# 🐺 Coiote — Log de Desenvolvimento (Semana 9 - Fase 3 Iniciada)

---

## 2026-03-01 — Início da Fase 3: Multi-Provider e Robustez

**Data e hora:** 2026-03-01T22:50:00-03:00

### Prompt Recebido Principal

> Você é um engenheiro sênior TypeScript iniciando o desenvolvimento do projeto Coiote.
>
> Leia os seguintes documentos antes de qualquer ação:
> - docs/coiote-prd.md — visão, filosofia e sistema de comunicação
> - docs/coiote-stack.md — stack completa e decisões arquiteturais
> - docs/coiote-development.md — estrutura de pastas, padrões de código, boas práticas
> - docs/coiote-orchestrator.md — plano de execução por fases
>
> vamos desenvolver a Fase 3
> Crie um documento chamado log seguindo a nomenclatura dos outros documentos da pasta na pasta /DOCS/Logs/ e ne registre data e hora, Prompt passado para você aqui, e sua resposta final. Atualize o Github, o coiote.config.md, o coiote-orchestrador.md

---

### Plano de Ação (Semanas 9-10)

1. **Multi-Provider Foundation**:
   - Implementar `OpenAIProvider` para suporte a GPT-4, Gemini (via OpenAI adapter) e DeepSeek.
   - Implementar `OllamaProvider` para modelos locais.
2. **Configuração Dinâmica**:
   - Adicionar comando `coiote config set-provider <name>` no CLI.
   - Integrar seleção de provider no `CoioteAgent`.
3. **Robustez e Resiliência**:
   - Implementar retry automático com exponential backoff para erros de API.
   - Refinar detecção de loops infinitos (repetição de tool calls).

---

### Progresso Atual

| Componente | Mudança | Detalhes Técnicos |
|------------|---------|----------|
| **Dependencies** | Instalação de `openai` | Adicionado SDK da OpenAI para suportar provedores compatíveis. |
| **Providers** | `src/providers/openai.ts` | Implementado suporte a modelos compatíveis com OpenAI (GPT-4, Gemini, DeepSeek) com streaming e tool calls. |
| **Providers** | `src/providers/ollama.ts` | Especialização para modelos locais rodando via Ollama. |
| **Factory** | `src/providers/factory.ts` | Criado `ProviderFactory` para instanciar dinamicamente o provider baseado na configuração ou no modelo solicitado. |
| **CLI** | `coiote config set-provider` | Novo comando para trocar o provedor padrão globalmente. |
| **Resiliência** | `src/utils/retry.ts` | Utilitário de retry com **exponential backoff** injetado nas chamadas de API dos provedores. |
| **Agente** | `src/utils/loop-protector.ts` | Integrado detector de loops infinitos no `CoioteAgent`. Ele interrompe a execução se detectar a repetição exata da mesma tool e argumentos mais de 3 vezes seguidas. |

### Cheques efetuados!

✔️ `pnpm build` executado com sucesso — novas dependências e tipos validados.
✔️ `ProviderFactory` integrando Anthropic, OpenAI e Ollama.
✔️ Lógica de retry testada estruturalmente.

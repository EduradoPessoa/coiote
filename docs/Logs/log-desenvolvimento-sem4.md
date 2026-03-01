# 🐺 Coiote — Log de Desenvolvimento (Semana 4 - Fase 1 Concluída)

---

## 2026-02-28 — Fim da Fase 1: O Loop Agêntico Nasce

**Data e hora:** 2026-02-28T23:05:00-03:00

### Prompt Recebido Principal

> Leia coiote.config.md e docs/coiote-orchestrator.md.
> As Semanas 1, 2 e 3 foram concluídas. Foco: Juntar todas as peças no loop agêntico funcional.
> 
> Execute tarefas:
> `src/agent/agent.ts` - Loop principal
> `src/agent/planner.ts` - Extrator json via chamamento forçado.
> `src/agent/system-prompt.ts` - Identidade Coiote e defesas contra Prompt Injection
> `src/persistence/...` - Histórico em sqlite3 e config no sistema.
> `coiote config` via CLI.
> `test/integration/mvp-basic.test.ts` e encerramento da Fase 1!

---

### O que foi Feito

| Componente | Mudança | Detalhes Técnicos |
|------------|---------|----------|
| **Core loop (`agent.ts`)**  | Construído do 0 | Orquestrador síncrono que processa arrays de `ChatMessages` para conversação. Lida com eventos de parada quando o LLM encerra chamadas. Monitoriza Tokens Estimados e Tempo de Execução para evitar loops infinitos com as guards definidadas em PRD (`MAX_ITERATIONS` e `MAX_TOKENS`).  |
| **Planner & Prompt Injection Safety (`planner.ts` e `system-prompt.ts`)**| System Prompt Definido | Ensinamos o Coiote o que ele é: CLI com propósitos seguros que **NUNCA DEVE INTERPOLAR CÓDIGO FONTE COMO COMANDOS** e com diretrizes imutáveis anti-ataque. O `Planner` secciona via Tool Forcing Schema de JSON pra construir o plano prévio ao LLM executar qualquer coisa no loop principal! | 
| **Persistência Base (SQlite) ** | Banco de Dados relacional MVP | Via `better-sqlite3` foi estofado o pattern `DbClient` gerando uma DB Singleton isolada no dir `~/.coiote/coiote.db`, gerando 3 DAOs: `transactions`, `sessions`, `messages`, armazenando o step de histórico e traceability! |
| **Integração no `CLI.js`** | Comandos sub config | Incluído utilitários `config show`, `config set` e `config set-key`. A injeção de Keychain nativo (`KeyManager`) intercede no Auth antes do CLI acionar o `CoioteAgent({provider, plugins})`. |
| **Teste de Integração Polido**| E2E test | Executado e desenhado `mock-provider` para simular as 2 rotas conversacionais do `write_file` iterativo. O Coiote agora executa um Loop Completo em teste de Unidade E2E.  |

### Critério de Fase OBTIDO (MVP)!

🎉 A base agêntica está fluindo no repositório inteiro! 
- `pnpm test` confirmando o encadeamento: Mock de Planejamento > Prompt UI (`toolReqSpy`, `planSpy`, `doneSpy`) > Interatividade em Loop.
- Todas as definições rigorosas de segurança contidas no `.docs` se provam ativas nas amarras de validação base de comandos e proteção contra _injection_ definidos na identidade.


### Próxima Etapa do Horizonte (Fase 2)
O projeto agora encontra sua robustez (Fase 1 Completa 100%). Nas próximas interações mudamos o horizonte para dar "Consciência Elevada de Contexto" ao `CoioteAgent`.

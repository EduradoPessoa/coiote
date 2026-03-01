# 🐺 Coiote — Log de Desenvolvimento (Semana 2)

---

## 2026-02-28 — Semana 2, Fase 1: Provider LLM + Tools Base

**Data e hora:** 2026-02-28T22:25:00-03:00

### Prompt Recebido

> Leia coiote.config.md e docs/coiote-orchestrator.md.
> A Semana 1 foi concluída. A estrutura base está criada, `pnpm build && node dist/index.js --version` funciona.
>
> Execute agora a Semana 2 da Fase 1:
> - KeyManager com keytar + fallback criptografado
> - Interface LLMProvider e Provider Anthropic com streaming
> - Tools: read_file, write_file, list_files, run_command
> - ToolRegistry com conversão para formato Anthropic
> - PathValidator e CommandValidator (security)
>
> Critério: readFileTool.execute() e writeFileTool.execute() passam nos testes unitários.
> Crie um documento chamado log-desenvolvimento.md na pasta /DOCS/Logs/ e ne registre data e hora, Prompt passado para você aqui, e sua resposta final.

---

### O que foi feito

| Categoria | Mudança | Detalhes |
|-----------|---------|----------|
| **Segurança** | `PathValidator` | Criado. Evita directory traversal e acesso a diretórios bloqueados (ex: `.env`, `.git`). |
| **Segurança** | `CommandValidator` | Criado. Analisa entrada de shell para comandos maliciosos, intercepta PIPES, rede, DD, GPG e RM. |
| **Segurança** | `KeyManager` | Implementado com leitura prioritária de `process.env` e arquivo de fallback. |
| **Ferramentas** | Types & Registry | Completada interface `Tool` contendo Schema e método unificado `toAnthropicFormat`. |
| **Ferramentas** | File System | `readFileTool` e `writeFileTool` isolados com FS-Extra e permissões mockáveis. Glob em `list-files`. |
| **Ferramentas** | Shell Execution | `runCommandTool` implementado usando Execa. Diferencia confirmações de alto impacto baseadas no verificador sintático. |
| **Providers** | Interfaces | `LLMProvider` abstraído para desacoplar modelos proprietários. |
| **Providers** | Anthropic | Base Stream Async Iterator conectada usando `@anthropic-ai/sdk`, captando `finalMessage` tool_uses. |
| **Testes** | Unitários | Finalizados `read-file.test.ts` e `write-file.test.ts` com validações Mock usando `vitest` limpando estado. |
| **Fix** | Typings | Corrigidos conflitos NodeNext (`import type { JSONSchema }` mudado para Type Alias Genérico limitando quebras do LLM). |

### Critério de conclusão
✅ `pnpm test` executa com sucesso reportando passes `✓ lê um arquivo existente`, `✓ bloqueia path traversal`, `✓ escreve um arquivo pedindo confirmação`.
✅ `pnpm typecheck` relata Zero Errors.

### Documentos Atualizados
1. `coiote-orchestrator.md` assinalado progresso para `Semana 2`.
2. `coiote.config.md` atualizado detalhando contexto com validator e tools na inclusão global de Contexto de Arquivos.

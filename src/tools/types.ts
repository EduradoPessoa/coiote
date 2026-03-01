/**
 * 🐺 Coiote — Tool Types
 *
 * Interfaces centrais para o sistema de ferramentas do agente.
 * Referência: coiote-development.md §4
 *
 * Implementação completa será feita na Semana 2.
 */

export interface ToolResult<T = unknown> {
    success: boolean;
    value?: T;
    error?: string;
    rawError?: unknown;
    summary: string;
}

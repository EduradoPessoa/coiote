/**
 * Coiote - Exit Codes
 *
 * Define códigos de saída semânticos para uso em CI/CD.
 * O Coiote retorna códigos específicos para diferentes situações.
 *
 * Referencia: coiote-orchestrator.md Secao 5 (Semanas 11-12)
 */

export enum ExitCode {
  SUCCESS = 0,
  GENERAL_ERROR = 1,
  PERMISSION_DENIED = 2,
  RATE_LIMIT_EXCEEDED = 3,
  TIMEOUT = 4,
  CONTEXT_OVERFLOW = 5,
  PROVIDER_ERROR = 6,
  CONFIGURATION_ERROR = 7,
  TOOL_ERROR = 8,
}

export class ExitCodeMapper {
  static fromError(error: unknown): ExitCode {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes('permission') || message.includes('permissao')) {
        return ExitCode.PERMISSION_DENIED;
      }
      if (message.includes('rate limit')) {
        return ExitCode.RATE_LIMIT_EXCEEDED;
      }
      if (message.includes('timeout') || message.includes('timed out')) {
        return ExitCode.TIMEOUT;
      }
      if (message.includes('context') && message.includes('overflow')) {
        return ExitCode.CONTEXT_OVERFLOW;
      }
      if (message.includes('api') || message.includes('provider')) {
        return ExitCode.PROVIDER_ERROR;
      }
      if (message.includes('config')) {
        return ExitCode.CONFIGURATION_ERROR;
      }
      if (message.includes('tool') || message.includes('execution')) {
        return ExitCode.TOOL_ERROR;
      }
    }

    return ExitCode.GENERAL_ERROR;
  }

  static getDescription(code: ExitCode): string {
    const descriptions: Record<ExitCode, string> = {
      [ExitCode.SUCCESS]: 'Tarefa concluida com sucesso',
      [ExitCode.GENERAL_ERROR]: 'Erro geral',
      [ExitCode.PERMISSION_DENIED]: 'Permissao negada pelo usuario',
      [ExitCode.RATE_LIMIT_EXCEEDED]: 'Limite de requests excedido',
      [ExitCode.TIMEOUT]: 'Tempo de execucao excedido',
      [ExitCode.CONTEXT_OVERFLOW]: 'Context window do LLM excedido',
      [ExitCode.PROVIDER_ERROR]: 'Erro na comunicacao com o provedor LLM',
      [ExitCode.CONFIGURATION_ERROR]: 'Erro de configuracao',
      [ExitCode.TOOL_ERROR]: 'Erro na execucao de uma ferramenta',
    };
    return descriptions[code];
  }
}

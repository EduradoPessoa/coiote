/**
 * 🐺 Coiote — Error Recovery
 *
 * Implementa recuperação automática para erros comuns encontrados
 * durante a execução de tools. Analisa o erro e tenta estratégias
 * alternativas antes de escalar para o usuário.
 *
 * Referência: coiote-orchestrator.md §5 (Semanas 9-10)
 */

import type { ToolResult } from '../tools/types.js';

export enum RecoveryStrategy {
  RETRY = 'retry',
  ALTERNATIVE_PATH = 'alternative_path',
  ASK_USER = 'ask_user',
  SKIP = 'skip',
  ABORT = 'abort',
}

export interface ErrorPattern {
  pattern: RegExp;
  strategy: RecoveryStrategy;
  description: string;
  maxRetries?: number;
}

const COMMON_ERROR_PATTERNS: ErrorPattern[] = [
  // Arquivo não encontrado - pode tentar caminho alternativo
  {
    pattern: /(?:file not found|enoent|no such file|arquivo não encontrado)/i,
    strategy: RecoveryStrategy.ALTERNATIVE_PATH,
    description: 'Arquivo não encontrado. Verificando se o caminho está correto...',
  },
  // Erro de permissão - tentar com sudo ou perguntar
  {
    pattern: /(?:permission denied|eacces|access denied|permissão negada)/i,
    strategy: RecoveryStrategy.ASK_USER,
    description: 'Erro de permissão. O usuário pode precisar executar com privilégios.',
  },
  // Erro de rede - retry com backoff
  {
    pattern: /(?:network error|ECONNREFUSED|timeout|timed out|conexão)/i,
    strategy: RecoveryStrategy.RETRY,
    description: 'Erro de rede. Tentando novamente...',
    maxRetries: 3,
  },
  // Erro de API rate limit - esperar e retry
  {
    pattern: /(?:rate limit|too many requests|429)/i,
    strategy: RecoveryStrategy.RETRY,
    description: 'Rate limit atingido. Aguardando e tentanto novamente...',
    maxRetries: 5,
  },
  // Erro de autenticação
  {
    pattern: /(?:authentication|unauthorized|401|api key|chave de api)/i,
    strategy: RecoveryStrategy.ASK_USER,
    description: 'Erro de autenticação. Verifique as credenciais.',
  },
  // Erro de dependência não encontrada
  {
    pattern: /(?:module not found|cannot find module|enoent.*module)/i,
    strategy: RecoveryStrategy.ALTERNATIVE_PATH,
    description: 'Módulo não encontrado. Tentando instalar dependência...',
  },
  // Erro de sintaxe em arquivo criado
  {
    pattern: /(?:syntax error|parse error|unexpected token)/i,
    strategy: RecoveryStrategy.ASK_USER,
    description: 'Erro de sintaxe no código gerado.',
  },
  // Comando não encontrado
  {
    pattern: /(?:command not found|not recognized|unknown command)/i,
    strategy: RecoveryStrategy.ASK_USER,
    description: 'Comando não encontrado no sistema.',
  },
];

export class ErrorRecovery {
  private retryCount: Map<string, number> = new Map();

  constructor(
    private reporter?: {
      warning: (msg: string) => void;
      info: (msg: string) => void;
    }
  ) {}

  analyzeError(error: unknown): {
    strategy: RecoveryStrategy;
    description: string;
    shouldRetry: boolean;
    maxRetries: number;
  } {
    const errorMessage = error instanceof Error ? error.message : String(error);

    for (const pattern of COMMON_ERROR_PATTERNS) {
      if (pattern.pattern.test(errorMessage)) {
        const currentRetries = this.retryCount.get(errorMessage) || 0;
        const maxRetries = pattern.maxRetries ?? 1;

        return {
          strategy: pattern.strategy,
          description: pattern.description,
          shouldRetry: currentRetries < maxRetries,
          maxRetries,
        };
      }
    }

    // Erro desconhecido - pedir ajuda ao usuário
    return {
      strategy: RecoveryStrategy.ASK_USER,
      description: 'Erro desconhecido. Preciso de sua ajuda para resolver.',
      shouldRetry: false,
      maxRetries: 0,
    };
  }

  async recover(
    error: unknown,
    toolName: string,
    input: Record<string, unknown>,
    recoveryFn: () => Promise<ToolResult>
  ): Promise<{ result: ToolResult; recovered: boolean }> {
    const analysis = this.analyzeError(error);
    const errorKey = `${toolName}:${JSON.stringify(input)}`;

    this.retryCount.set(errorKey, (this.retryCount.get(errorKey) || 0) + 1);

    this.reporter?.info(`Estratégia de recuperação: ${analysis.description}`);

    switch (analysis.strategy) {
      case RecoveryStrategy.RETRY:
        if (analysis.shouldRetry) {
          const result = await recoveryFn();
          if (result.success) {
            this.retryCount.delete(errorKey);
            return { result, recovered: true };
          }
        }
        break;

      case RecoveryStrategy.SKIP:
        return {
          result: {
            success: false,
            error: 'Operação ignorada devido a erro não recuperável',
            summary: `${toolName} ignorado`,
          },
          recovered: false,
        };

      case RecoveryStrategy.ABORT:
        return {
          result: {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            summary: `${toolName} aborted due to unrecoverable error`,
          },
          recovered: false,
        };

      case RecoveryStrategy.ASK_USER:
      case RecoveryStrategy.ALTERNATIVE_PATH:
        // Não pode recuperar automaticamente - retorna para tratamento externo
        break;
    }

    return {
      result: {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        summary: `${toolName} failed: ${analysis.description}`,
      },
      recovered: false,
    };
  }

  resetRetries(): void {
    this.retryCount.clear();
  }
}

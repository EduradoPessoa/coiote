/**
 * 🐺 Coiote — Rate Limiter
 *
 * Limita o uso de tokens e requisições por sessão para evitar custos excessivos.
 * Implementa limites configuráveis de tokens por sessão e requests por minuto.
 *
 * Referência: coiote-security.md §5
 */

export interface RateLimitConfig {
  maxTokensPerSession: number;
  maxRequestsPerMinute: number;
  maxIterations: number;
  maxExecutionTimeMs: number;
}

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxTokensPerSession: 500_000,
  maxRequestsPerMinute: 60,
  maxIterations: 50,
  maxExecutionTimeMs: 10 * 60 * 1000, // 10 minutos
};

export class RateLimiter {
  private tokenCount = 0;
  private requestTimestamps: number[] = [];
  private iterationCount = 0;
  private startTime: number;

  constructor(private config: RateLimitConfig = DEFAULT_RATE_LIMIT) {
    this.startTime = Date.now();
  }

  addTokens(count: number): void {
    this.tokenCount += count;
  }

  addRequest(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60_000;

    // Remove timestamps antigos
    this.requestTimestamps = this.requestTimestamps.filter((ts) => ts > oneMinuteAgo);

    // Verifica limite de requests por minuto
    if (this.requestTimestamps.length >= this.config.maxRequestsPerMinute) {
      return false;
    }

    this.requestTimestamps.push(now);
    return true;
  }

  addIteration(): boolean {
    this.iterationCount++;
    return this.iterationCount <= this.config.maxIterations;
  }

  canContinue(): { canContinue: boolean; reason?: string } {
    // Verifica tokens
    if (this.tokenCount >= this.config.maxTokensPerSession) {
      return {
        canContinue: false,
        reason: `Limite de tokens por sessão atingido (${this.tokenCount}/${this.config.maxTokensPerSession})`,
      };
    }

    // Verifica tempo
    const elapsed = Date.now() - this.startTime;
    if (elapsed >= this.config.maxExecutionTimeMs) {
      return {
        canContinue: false,
        reason: `Tempo máximo de execução atingido (${Math.floor(elapsed / 1000)}s)`,
      };
    }

    // Verifica iterations
    if (this.iterationCount >= this.config.maxIterations) {
      return {
        canContinue: false,
        reason: `Limite de iterações atingido (${this.iterationCount})`,
      };
    }

    return { canContinue: true };
  }

  getStats() {
    return {
      tokensUsed: this.tokenCount,
      maxTokens: this.config.maxTokensPerSession,
      iterations: this.iterationCount,
      maxIterations: this.config.maxIterations,
      requestsPerMinute: this.requestTimestamps.length,
      maxRequestsPerMinute: this.config.maxRequestsPerMinute,
      elapsedTimeMs: Date.now() - this.startTime,
    };
  }

  reset(): void {
    this.tokenCount = 0;
    this.requestTimestamps = [];
    this.iterationCount = 0;
    this.startTime = Date.now();
  }
}

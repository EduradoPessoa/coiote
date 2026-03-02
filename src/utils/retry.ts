export async function withRetry<T>(
    fn: () => Promise<T>,
    options: { maxRetries?: number; initialDelay?: number; maxDelay?: number } = {}
): Promise<T> {
    const { maxRetries = 3, initialDelay = 1000, maxDelay = 10000 } = options;
    let lastError: any;

    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await fn();
        } catch (e: any) {
            lastError = e;
            // Só tenta novamente se for erro de rede ou rate limit (status 429 ou 5xx)
            const error = e as { status?: number; statusCode?: number };
            const status = error.status || error.statusCode;
            if (i < maxRetries && (status === 429 || (status >= 500 && status < 600))) {
                const delay = Math.min(initialDelay * Math.pow(2, i), maxDelay);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw e;
        }
    }
    throw lastError;
}

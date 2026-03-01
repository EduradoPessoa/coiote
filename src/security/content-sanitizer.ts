/**
 * Sanitiza conteúdos de arquivos removendo ou mascarando
 * dados sensíveis (API keys, segredos, chaves privadas)
 * antes de serem enviados ao LLM.
 */
export function sanitizeForLLM(content: string): string {
    if (!content) return content;

    return content
        // API Keys (Anthropic, OpenAI, etc)
        .replace(/sk-ant-[a-zA-Z0-9\-_]{40,}/gi, '<ANTHROPIC_API_KEY_REDACTED>')
        .replace(/sk-[a-zA-Z0-9]{48,}/gi, '<OPENAI_API_KEY_REDACTED>')

        // Variáveis de ambiente comuns
        .replace(/(ANTHROPIC_API_KEY|OPENAI_API_KEY|DATABASE_URL|DATABASE_PASSWORD|API_SECRET|JWT_SECRET|AWS_SECRET_ACCESS_KEY|STRIPE_SECRET_KEY)\s*[:=]\s*["']?[^\s"']+["']?/gi, (match, key) => `${key}=<REDACTED>`)

        // Senhas em JSON/Code
        .replace(/(password|secret|token|apikey|passphrase)["']?\s*[:=]\s*["']([^"']+)["']/gi, (match, key) => `${key}: "<REDACTED>"`)

        // Chaves Privadas PEM
        .replace(/-----BEGIN.*PRIVATE KEY-----[\s\S]*?-----END.*PRIVATE KEY-----/g, '<PRIVATE_KEY_REDACTED>')

        // Tokens JWT (Detector básico de estrutura base64.base64.base64)
        .replace(/eyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+/g, '<JWT_TOKEN_REDACTED>');
}

/**
 * 🐺 Coiote — Hierarquia de Erros
 *
 * Todos os erros do Coiote estendem CoioteError.
 * Cada erro contém informação suficiente para exibir ao usuário
 * uma mensagem clara sobre o que falhou e por quê.
 *
 * Referência: coiote-development.md §7
 */

/**
 * Códigos de erro do Coiote — permitem tratamento programático.
 */
export enum ErrorCode {
    // Tool errors (1xx)
    TOOL_EXECUTION_FAILED = 'TOOL_EXECUTION_FAILED',
    TOOL_NOT_FOUND = 'TOOL_NOT_FOUND',
    TOOL_VALIDATION_FAILED = 'TOOL_VALIDATION_FAILED',

    // Permission errors (2xx)
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    PERMISSION_CONFIG_INVALID = 'PERMISSION_CONFIG_INVALID',

    // Provider / LLM errors (3xx)
    PROVIDER_API_ERROR = 'PROVIDER_API_ERROR',
    PROVIDER_AUTH_FAILED = 'PROVIDER_AUTH_FAILED',
    PROVIDER_RATE_LIMITED = 'PROVIDER_RATE_LIMITED',
    PROVIDER_TIMEOUT = 'PROVIDER_TIMEOUT',

    // Configuration errors (4xx)
    CONFIG_INVALID = 'CONFIG_INVALID',
    CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',
    CONFIG_PARSE_ERROR = 'CONFIG_PARSE_ERROR',

    // Context errors (5xx)
    CONTEXT_OVERFLOW = 'CONTEXT_OVERFLOW',
    CONTEXT_COMPACTION_FAILED = 'CONTEXT_COMPACTION_FAILED',

    // General errors
    UNKNOWN = 'UNKNOWN',
}

/**
 * Erro base do Coiote.
 *
 * Todos os erros do sistema estendem esta classe.
 * Contém um `code` para tratamento programático e
 * `context` opcional com metadados para debugging.
 */
export class CoioteError extends Error {
    constructor(
        message: string,
        public readonly code: ErrorCode,
        public readonly context?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'CoioteError';

        // Mantém prototype chain correto para instanceof
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/**
 * Erro de execução de Tool.
 *
 * Registra o que foi tentado para exibir ao usuário
 * um histórico de tentativas antes da falha.
 */
export class ToolExecutionError extends CoioteError {
    constructor(
        public readonly toolName: string,
        message: string,
        public readonly attempted: string[],
        public readonly rawError?: unknown
    ) {
        super(message, ErrorCode.TOOL_EXECUTION_FAILED, { toolName, attempted });
        this.name = 'ToolExecutionError';
    }
}

/**
 * Erro de permissão negada.
 *
 * Usado quando o usuário cancela uma ação ou a configuração
 * de permissões bloqueia a operação.
 */
export class PermissionDeniedError extends CoioteError {
    constructor(
        public readonly action: string,
        message?: string
    ) {
        super(message ?? `Permissão negada para a ação: ${action}`, ErrorCode.PERMISSION_DENIED, {
            action,
        });
        this.name = 'PermissionDeniedError';
    }
}

/**
 * Erro de Provider / LLM.
 *
 * Usado para erros de API, autenticação, rate limiting e timeouts
 * na comunicação com o modelo de linguagem.
 */
export class ProviderError extends CoioteError {
    constructor(
        public readonly provider: string,
        message: string,
        code: ErrorCode = ErrorCode.PROVIDER_API_ERROR,
        public readonly statusCode?: number
    ) {
        super(message, code, { provider, statusCode });
        this.name = 'ProviderError';
    }
}

/**
 * Erro de configuração.
 *
 * Usado quando o coiote.config.md, variáveis de ambiente
 * ou configurações globais são inválidas ou estão ausentes.
 */
export class ConfigurationError extends CoioteError {
    constructor(
        message: string,
        code: ErrorCode = ErrorCode.CONFIG_INVALID,
        public readonly configPath?: string
    ) {
        super(message, code, { configPath });
        this.name = 'ConfigurationError';
    }
}

/**
 * Erro de overflow de contexto.
 *
 * Usado quando o context window do LLM é excedido
 * e a compactação não consegue liberar espaço suficiente.
 */
export class ContextOverflowError extends CoioteError {
    constructor(
        public readonly currentTokens: number,
        public readonly maxTokens: number,
        message?: string
    ) {
        super(
            message ??
            `Context overflow: ${String(currentTokens)} tokens excede o limite de ${String(maxTokens)}`,
            ErrorCode.CONTEXT_OVERFLOW,
            { currentTokens, maxTokens }
        );
        this.name = 'ContextOverflowError';
    }
}

export type JSONSchema = Record<string, unknown>;

export interface Reporter {
    toolCall(tool: string, args: Record<string, unknown>, diff?: string): void;
    toolResult(tool: string, success: boolean, summary: string): void;
    error(error: any, options?: { label: string; value: string }[]): void;
    info(message: string): void;
    warning(message: string, context?: string): void;
}

export interface PermissionRequest {
    tool: string;
    action?: string;
    path?: string;
    command?: string;
    preview?: string;
    isOverwrite?: boolean;
}

export interface HighRiskPermissionRequest {
    action: string;
    command: string;
    potentialImpact: string;
}

export interface PermissionManager {
    request(req: PermissionRequest): Promise<boolean>;
    requestHighRisk(req: HighRiskPermissionRequest): Promise<boolean>;
}

export interface ToolContext {
    projectRoot: string;
    reporter: Reporter;
    permissionManager: PermissionManager;
    signal: AbortSignal;
}

export interface ToolResult<T = unknown> {
    success: boolean;
    value?: T;
    error?: string;
    rawError?: unknown;
    summary: string;
}

export interface Tool<TInput = unknown, TOutput = unknown> {
    /** Nome da tool — deve ser snake_case, único no registro */
    name: string;

    /** Descrição enviada ao LLM para ele saber quando usar */
    description: string;

    /** Schema JSON da entrada (usado para validação e para o LLM) */
    inputSchema: any;

    /** Requer confirmação do usuário antes de executar? */
    requiresConfirmation: boolean;

    /** É uma operação destrutiva/irreversível? */
    isDestructive: boolean;

    /** Executa a tool e retorna o resultado */
    execute(input: TInput, context: ToolContext): Promise<ToolResult<TOutput>>;
}

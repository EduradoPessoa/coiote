import crypto from 'crypto';
import type { LLMProvider, ChatMessage, StreamEvent } from '../providers/types.js';
import type { Reporter, Step, ExecutionPlan } from '../ui/reporter.js';
import { AgentPlanner } from './planner.js';
import { SessionDAO } from '../persistence/sessions.js';
import { MessageDAO } from '../persistence/messages.js';
import type { ToolRegistry } from '../tools/registry.js';
import type { PermissionManager } from '../permissions/permission-manager.js';
import { SYSTEM_PROMPT } from './system-prompt.js';
import { ContextOverflowError } from '../errors.js';
import { simpleGit } from 'simple-git';
import type { GlobalConfig } from '../config/global-config.js';
import type { ProjectConfig } from '../config/project-config.js';
import { ContextManager } from './context-manager.js';
import { ToolCallDAO } from '../persistence/tool-calls.js';
import { ContextCompactor } from './compactor.js';
import { withRetry } from '../utils/retry.js';
import { LoopProtector } from '../utils/loop-protector.js';

// Import Anthropic Tool directly for types or use registry abstraction
export interface CoioteAgentConfig {
    provider: LLMProvider;
    projectRoot: string;
    reporter: Reporter;
    tools: ToolRegistry;
    permissions: PermissionManager;
    model: string;
    globalConfig: GlobalConfig;
    projectConfig: ProjectConfig;
}

const LOOP_GUARDS = {
    MAX_ITERATIONS: 50,
    MAX_TOKENS: 180_000,
    MAX_EXECUTION_TIME_MS: 10 * 60 * 1000,
    CONTEXT_COMPACTION_THRESHOLD: 100_000,
};

function estimateTokensLen(messages: ChatMessage[]): number {
    return JSON.stringify(messages).length / 4;
}

export class CoioteAgent {
    private planner: AgentPlanner;
    private sessionDb = new SessionDAO();
    private messagesDb = new MessageDAO();
    private toolCallDb = new ToolCallDAO();
    private abortController = new AbortController();
    private contextManager: ContextManager;
    private compactor: ContextCompactor;
    private loopProtector = new LoopProtector();

    constructor(private config: CoioteAgentConfig) {
        this.planner = new AgentPlanner(config.provider, config.reporter);
        this.contextManager = new ContextManager(config.projectRoot);
        this.compactor = new ContextCompactor(config.provider, config.reporter);
    }

    abort(): void {
        this.abortController.abort();
    }

    async run(prompt: string): Promise<void> {
        const startedAt = Date.now();
        const sessionId = crypto.randomUUID();
        let iterCount = 0;
        let filesModifiedCount = 0;
        let commandsCount = 0;

        // Simulate basic proj name extraction
        const projName = this.config.projectRoot.split(/[\\/]/).pop() || 'unknown';

        // Persist Initialization
        this.sessionDb.createSession({
            id: sessionId,
            projectPath: this.config.projectRoot,
            projectName: projName,
            model: this.config.model,
        });
        const taskId = this.sessionDb.createTask(sessionId, prompt);

        try {
            const plan = await this.planner.generate(prompt, `Project Root: ${this.config.projectRoot}`);
            if (!plan) throw new Error('Falha ao gerar o plano de execução.');

            this.config.reporter.plan(plan);

            // Preparar Contexto Inicial
            const alwaysInclude = this.config.projectConfig.alwaysInclude || [];
            const initialContextFiles = await this.contextManager.collectInitialContext(alwaysInclude);
            const contextString = this.contextManager.formatContext(initialContextFiles);

            const systemPromptWithContext = `${SYSTEM_PROMPT}\n\nCONTEXTO DO PROJETO ATUAL:\n${contextString}`;

            const history: ChatMessage[] = [
                { role: 'user', content: prompt }
            ];

            while (iterCount < LOOP_GUARDS.MAX_ITERATIONS) {
                if (Date.now() - startedAt > LOOP_GUARDS.MAX_EXECUTION_TIME_MS) {
                    throw new Error(`Timeout de execução atingido (${LOOP_GUARDS.MAX_EXECUTION_TIME_MS}ms)`);
                }

                iterCount++;
                let tokenEst = estimateTokensLen(history);

                // Check for Compaction
                if (tokenEst > LOOP_GUARDS.CONTEXT_COMPACTION_THRESHOLD) {
                    const result = await this.compactor.compact(history);
                    if (result.summary) {
                        // Mark old messages as compacted in DB (session logic)
                        this.messagesDb.markAsCompacted(sessionId);
                        history.length = 0;
                        history.push(...result.compactedHistory);
                        tokenEst = estimateTokensLen(history);
                    }
                }

                if (tokenEst > LOOP_GUARDS.MAX_TOKENS) {
                    throw new ContextOverflowError(tokenEst, LOOP_GUARDS.MAX_TOKENS);
                }

                const stream = this.config.provider.stream({
                    messages: history as any,
                    system: systemPromptWithContext,
                    tools: this.config.tools.toAnthropicFormat() as any
                });

                let hasToolCalls = false;
                const currentToolCalls: { id: string; name: string; input: Record<string, unknown> }[] = [];
                let modelText = '';

                for await (const chunk of stream) {
                    if (chunk.type === 'text' && chunk.text) {
                        modelText += chunk.text;
                        this.config.reporter.verbose(chunk.text);
                    }
                    if (chunk.type === 'tool_use' && chunk.toolCall) {
                        hasToolCalls = true;
                        currentToolCalls.push({
                            id: chunk.toolCall.id,
                            name: chunk.toolCall.name,
                            input: chunk.toolCall.input as Record<string, unknown>
                        });
                    }
                }

                // Verbose tokens
                const inputEst = estimateTokensLen(history);
                this.config.reporter.info(`[Step ${iterCount}] Tokens: ~${inputEst} (contexto)`);

                // Apply assistant output to history
                const astBlocks: any[] = [];
                if (modelText) astBlocks.push({ type: 'text', text: modelText });

                currentToolCalls.forEach(t => astBlocks.push({
                    type: 'tool_use',
                    id: t.id,
                    name: t.name,
                    input: t.input
                }));

                history.push({ role: 'assistant', content: astBlocks });

                if (!hasToolCalls) {
                    // Loop exit, finished
                    break;
                }

                // Execute Tools 
                const toolResultBlocks: any[] = [];

                for (const t of currentToolCalls) {
                    const inputJson = JSON.stringify(t.input);
                    if (this.loopProtector.check(t.name, inputJson)) {
                        this.config.reporter.warning(`Possível loop infinito detectado na ferramenta [${t.name}]. Interrompendo loop secundário.`);
                        toolResultBlocks.push({
                            type: 'tool_result',
                            tool_use_id: t.id,
                            content: `Error: Loop detectado. Por favor, tente uma abordagem diferente ou peça ajuda ao usuário.`,
                            is_error: true
                        });
                        continue;
                    }

                    const toolInterface = this.config.tools.get(t.name);
                    let statusRes = { success: false, summary: '', error: '' };
                    if (t.name === 'write_file') filesModifiedCount++;
                    if (t.name === 'run_command') commandsCount++;

                    const toolStartTime = Date.now();
                    try {
                        // Context execution bind
                        const res = await toolInterface.execute(t.input, {
                            projectRoot: this.config.projectRoot,
                            reporter: this.config.reporter,
                            permissionManager: this.config.permissions,
                            signal: this.abortController.signal
                        });

                        const duration = Date.now() - toolStartTime;
                        this.config.reporter.toolResult(t.name, res.success, res.summary || '');

                        statusRes = {
                            success: res.success,
                            summary: res.success ? res.summary : (res.error || 'Erro desconhecido'),
                            error: !res.success ? (res.error || 'Erro desconhecido') : ''
                        };

                        // Persistir Tool Call
                        this.toolCallDb.create({
                            sessionId,
                            taskId,
                            toolName: t.name,
                            inputJson: JSON.stringify(t.input),
                            outputJson: JSON.stringify(res.value || {}),
                            success: res.success,
                            summary: res.summary,
                            durationMs: duration
                        });

                    } catch (e: any) {
                        const errMsg = e.message || 'Unknown Execution Error';
                        this.config.reporter.error(new Error(errMsg));
                        statusRes = { success: false, summary: '', error: errMsg };

                        // Persistir Falha
                        this.toolCallDb.create({
                            sessionId,
                            taskId,
                            toolName: t.name,
                            inputJson: JSON.stringify(t.input),
                            success: false,
                            summary: errMsg,
                            durationMs: Date.now() - toolStartTime
                        });
                    }

                    toolResultBlocks.push({
                        type: 'tool_result',
                        tool_use_id: t.id,
                        content: statusRes.success ? statusRes.summary : `Error: ${statusRes.error}`,
                        is_error: !statusRes.success
                    });
                }

                // Push Tool returns
                history.push({
                    role: 'user',
                    content: toolResultBlocks
                });

                this.sessionDb.updateSessionActivity(sessionId);
            }

            this.sessionDb.completeTask(taskId, {
                filesModified: filesModifiedCount,
                iterations: iterCount,
                commandsRun: commandsCount
            });
            // Save history background
            this.messagesDb.saveHistory(sessionId, taskId, history as any[]);

            const durationSec = (Date.now() - startedAt) / 1000;
            const finalTokens = estimateTokensLen(history);

            this.config.reporter.done(
                `Tarefa finalizada em ${durationSec.toFixed(1)}s e ${iterCount} iterações.`,
                [
                    { label: 'Arquivos Modificados', value: String(filesModifiedCount) },
                    { label: 'Comandos Executados', value: String(commandsCount) },
                    { label: 'Tokens Estimados', value: String(finalTokens) }
                ]
            );

            // Auto-commit logic
            if (this.config.globalConfig.autoCommit && !process.argv.includes('--no-git')) {
                const git = simpleGit(this.config.projectRoot);
                if (await git.checkIsRepo()) {
                    try {
                        await git.add('.');
                        await git.commit(`Coiote Task [${taskId.toString()}]: ${prompt}`);
                    } catch (e) {
                        this.config.reporter.warning('Auto-commit falhou: ' + (e instanceof Error ? e.message : String(e)));
                    }
                }
            }

        } catch (e: any) {
            this.config.reporter.error(e);
            this.sessionDb.completeTask(taskId, {
                filesModified: filesModifiedCount,
                iterations: iterCount,
                commandsRun: commandsCount,
                isError: true,
                errorMessage: e.message
            });
            throw e;
        }
    }
}

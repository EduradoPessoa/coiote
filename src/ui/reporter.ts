import { EventEmitter } from 'events';
import { CoioteError } from '../errors.js';

export interface ExecutionPlan {
    steps: string[];
    filesToModify?: string[];
}

export interface Step {
    title: string;
}

export interface ExecutionSummary {
    filesModified: string[];
    testResults?: string;
    tokensUsed?: number;
    duration?: number;
}

export type CoioteEvent =
    | { type: 'plan'; plan: ExecutionPlan }
    | { type: 'step:start'; step: Step; current: number; total: number }
    | { type: 'tool:call'; tool: string; args: Record<string, unknown>; diff?: string }
    | { type: 'tool:result'; tool: string; success: boolean; summary: string }
    | { type: 'step:done'; step: Step }
    | { type: 'error'; error: CoioteError | Error; options?: { label: string; value: string }[] }
    | { type: 'warning'; message: string; context?: string }
    | { type: 'info'; message: string }
    | { type: 'verbose'; message: string }
    | { type: 'done'; summary: ExecutionSummary };

export class Reporter extends EventEmitter {
    private isQuiet = false;
    private isVerbose = false;

    constructor() {
        super();
    }

    // Modifiers
    quiet() {
        this.isQuiet = true;
        this.isVerbose = false;
    }

    verboseMode() {
        this.isVerbose = true;
        this.isQuiet = false;
    }

    // Override type safe emit
    emit<T extends CoioteEvent['type']>(
        event: T,
        data: Extract<CoioteEvent, { type: T }>
    ): boolean {
        if (this.isQuiet && !['error', 'done'].includes(event)) {
            return false; // Silent mode only allows error and done
        }
        if (!this.isVerbose && event === 'verbose') {
            return false; // Verbose event only allowed in verbose mode
        }
        return super.emit(event, data);
    }

    // Semantic shortcuts
    plan(plan: ExecutionPlan) {
        this.emit('plan', { type: 'plan', plan });
    }

    stepStart(step: Step, current: number, total: number) {
        this.emit('step:start', { type: 'step:start', step, current, total });
    }

    toolCall(tool: string, args: Record<string, unknown>, diff?: string) {
        const payload: Extract<CoioteEvent, { type: 'tool:call' }> = { type: 'tool:call', tool, args };
        if (diff !== undefined) payload.diff = diff;
        this.emit('tool:call', payload);
    }

    toolResult(tool: string, success: boolean, summary: string) {
        this.emit('tool:result', { type: 'tool:result', tool, success, summary });
    }

    stepDone(step: Step) {
        this.emit('step:done', { type: 'step:done', step });
    }

    error(error: CoioteError | Error, options?: { label: string; value: string }[]) {
        const payload: Extract<CoioteEvent, { type: 'error' }> = { type: 'error', error };
        if (options !== undefined) payload.options = options;
        this.emit('error', payload);
    }

    warning(message: string, context?: string) {
        const payload: Extract<CoioteEvent, { type: 'warning' }> = { type: 'warning', message };
        if (context !== undefined) payload.context = context;
        this.emit('warning', payload);
    }

    info(message: string) {
        this.emit('info', { type: 'info', message });
    }

    verbose(message: string) {
        this.emit('verbose', { type: 'verbose', message });
    }

    done(summary: ExecutionSummary) {
        this.emit('done', { type: 'done', summary });
    }
}

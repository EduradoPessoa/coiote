import { DbClient } from './db.js';

export interface ToolCallRecord {
    id?: number;
    sessionId: string;
    taskId?: number;
    toolName: string;
    inputJson: string;
    outputJson?: string;
    success: boolean;
    summary?: string;
    durationMs?: number;
    createdAt?: number;
}

export class ToolCallDAO {
    private db = DbClient.getInstance();

    create(call: ToolCallRecord): number {
        const stmt = this.db.prepare(`
            INSERT INTO tool_calls (
                session_id, task_id, tool_name, input_json, 
                output_json, success, summary, duration_ms, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            call.sessionId,
            call.taskId || null,
            call.toolName,
            call.inputJson,
            call.outputJson || null,
            call.success ? 1 : 0,
            call.summary || null,
            call.durationMs || 0,
            call.createdAt || Date.now()
        );

        return result.lastInsertRowid as number;
    }

    listBySession(sessionId: string): ToolCallRecord[] {
        const rows = this.db.prepare('SELECT * FROM tool_calls WHERE session_id = ? ORDER BY created_at ASC').all(sessionId);
        return rows as any[];
    }
}

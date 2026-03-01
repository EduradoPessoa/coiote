import { DbClient } from './db.js';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages.mjs';

export class MessageDAO {
    private db = DbClient.getInstance();

    appendMessage(sessionId: string, taskId: number, msg: MessageParam) {
        const stmt = this.db.prepare(`
       INSERT INTO messages (session_id, task_id, role, content, created_at)
       VALUES (?, ?, ?, ?, ?)
    `);

        // In Anthropic format, content can be array of blocks or string.
        const contentStr = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        stmt.run(sessionId, taskId, msg.role, contentStr, Date.now());
    }

    saveHistory(sessionId: string, taskId: number, history: MessageParam[]) {
        const runTransaction = this.db.transaction((hist: MessageParam[]) => {
            for (const msg of hist) {
                this.appendMessage(sessionId, taskId, msg);
            }
        });
        runTransaction(history);
    }

    markAsCompacted(sessionId: string) {
        this.db.prepare('UPDATE messages SET is_compacted = 1 WHERE session_id = ?').run(sessionId);
    }
}

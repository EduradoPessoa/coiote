import { DbClient } from './db.js';

export interface CoioteSession {
    id: string;
    projectPath: string;
    projectName: string;
    model: string;
    provider?: string;
}

export class SessionDAO {
    private db = DbClient.getInstance();

    createSession(session: CoioteSession) {
        const stmt = this.db.prepare(`
      INSERT INTO sessions (id, project_path, project_name, created_at, last_active_at, model, provider)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        const now = Date.now();
        stmt.run(session.id, session.projectPath, session.projectName, now, now, session.model, session.provider || 'anthropic');
    }

    createTask(sessionId: string, prompt: string): number {
        const stmt = this.db.prepare(`
      INSERT INTO tasks (session_id, prompt, started_at)
      VALUES (?, ?, ?)
    `);
        const info = stmt.run(sessionId, prompt, Date.now());
        return info.lastInsertRowid as number;
    }

    completeTask(taskId: number, partialData: { filesModified: number, iterations: number, commandsRun: number, isError?: boolean, errorMessage?: string }) {
        const stmt = this.db.prepare(`
        UPDATE tasks 
        SET completed_at = ?, status = ?, files_modified = ?, iterations = ?, commands_run = ?, error_message = ?
        WHERE id = ?
     `);
        const status = partialData.isError ? 'failed' : 'completed';
        stmt.run(Date.now(), status, partialData.filesModified, partialData.iterations, partialData.commandsRun, partialData.errorMessage || null, taskId);
    }

    updateSessionActivity(sessionId: string) {
        const stmt = this.db.prepare(`UPDATE sessions SET last_active_at = ? WHERE id = ?`);
        stmt.run(Date.now(), sessionId);
    }

    listRecent(limit: number) {
        return this.db.prepare('SELECT * FROM sessions ORDER BY last_active_at DESC LIMIT ?').all(limit) as any[];
    }

    getById(id: string) {
        return this.db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as any;
    }

    getStatistics() {
        const counts = this.db.prepare('SELECT COUNT(*) as count, SUM(total_tokens) as tokens FROM sessions').get() as any;
        const tasks = this.db.prepare('SELECT COUNT(*) as count FROM tasks').get() as any;
        return {
            sessionCount: counts.count || 0,
            totalTokens: counts.tokens || 0,
            taskCount: tasks.count || 0
        };
    }
}

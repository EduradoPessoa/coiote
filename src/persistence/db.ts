import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';

const DB_DIR = path.join(os.homedir(), '.coiote');
const DB_PATH = path.join(DB_DIR, 'coiote.db');

export class DbClient {
    private static instance: Database.Database;

    public static getInstance(): Database.Database {
        if (!this.instance) {
            fs.ensureDirSync(DB_DIR);
            this.instance = new Database(DB_PATH);
            // Run Initial schema migrations
            this.runMigrations(this.instance);
        }
        return this.instance;
    }

    private static runMigrations(db: Database.Database) {
        db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        project_path TEXT NOT NULL,
        project_name TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_active_at INTEGER NOT NULL,
        ended_at INTEGER,
        model TEXT NOT NULL,
        provider TEXT NOT NULL DEFAULT 'anthropic',
        total_tokens INTEGER NOT NULL DEFAULT 0,
        input_tokens INTEGER NOT NULL DEFAULT 0,
        output_tokens INTEGER NOT NULL DEFAULT 0,
        tasks_count INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active'
      );
      
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        prompt TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        completed_at INTEGER,
        status TEXT NOT NULL DEFAULT 'running',
        iterations INTEGER NOT NULL DEFAULT 0,
        files_modified INTEGER NOT NULL DEFAULT 0,
        files_created INTEGER NOT NULL DEFAULT 0,
        commands_run INTEGER NOT NULL DEFAULT 0,
        error_message TEXT
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        task_id INTEGER REFERENCES tasks(id),
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        tokens INTEGER,
        is_compacted INTEGER NOT NULL DEFAULT 0
      );
      
      CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_path);
      CREATE INDEX IF NOT EXISTS idx_tasks_session ON tasks(session_id);
      CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, created_at);
    `);
    }
}

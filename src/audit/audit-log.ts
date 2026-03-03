/**
 * Coiote - Audit Log
 *
 * Log append-only de açoes criticas para auditoria.
 * Armazena açoes destrutivas, acessos a dados sensiveis, etc.
 *
 * Referencia: coiote-security.md Secao 8
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';

export enum AuditEventType {
  TOOL_EXECUTION = 'TOOL_EXECUTION',
  FILE_DELETE = 'FILE_DELETE',
  FILE_WRITE = 'FILE_WRITE',
  COMMAND_EXECUTION = 'COMMAND_EXECUTION',
  GIT_COMMIT = 'GIT_COMMIT',
  CONFIG_CHANGE = 'CONFIG_CHANGE',
  API_KEY_ACCESS = 'API_KEY_ACCESS',
  PERMISSION_GRANTED = 'PERMISSION_GRANTED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SESSION_START = 'SESSION_START',
  SESSION_END = 'SESSION_END',
  ERROR = 'ERROR',
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  type: AuditEventType;
  user: string;
  sessionId?: string | undefined;
  details: Record<string, unknown>;
  success: boolean;
  error?: string | undefined;
}

export class AuditLog {
  private logPath: string;
  private fd: number | null = null;

  constructor(logDir?: string) {
    const dir = logDir || path.join(os.homedir(), '.coiote', 'logs');
    this.logPath = path.join(dir, 'audit.log');
  }

  private ensureOpen(): void {
    if (this.fd === null) {
      const dir = path.dirname(this.logPath);
      fs.mkdirSync(dir, { recursive: true });
      this.fd = fs.openSync(this.logPath, 'a');
    }
  }

  private close(): void {
    if (this.fd !== null) {
      fs.closeSync(this.fd);
      this.fd = null;
    }
  }

  log(event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
    this.ensureOpen();

    const fullEvent: AuditEvent = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      ...event,
    };

    const line = JSON.stringify(fullEvent) + '\n';
    fs.writeSync(this.fd!, line);
  }

  logToolExecution(
    toolName: string,
    args: Record<string, unknown>,
    success: boolean,
    sessionId?: string,
    error?: string
  ): void {
    this.log({
      type: AuditEventType.TOOL_EXECUTION,
      user: os.userInfo().username,
      sessionId,
      details: { toolName, args: this.sanitizeArgs(args) },
      success,
      error,
    });
  }

  logFileWrite(filePath: string, success: boolean, sessionId?: string): void {
    this.log({
      type: AuditEventType.FILE_WRITE,
      user: os.userInfo().username,
      sessionId,
      details: { filePath },
      success,
    });
  }

  logFileDelete(filePath: string, success: boolean, sessionId?: string, error?: string): void {
    this.log({
      type: AuditEventType.FILE_DELETE,
      user: os.userInfo().username,
      sessionId,
      details: { filePath },
      success,
      error,
    });
  }

  logCommandExecution(command: string, success: boolean, sessionId?: string, error?: string): void {
    this.log({
      type: AuditEventType.COMMAND_EXECUTION,
      user: os.userInfo().username,
      sessionId,
      details: { command },
      success,
      error,
    });
  }

  logGitCommit(commitHash: string, message: string, success: boolean, sessionId?: string): void {
    this.log({
      type: AuditEventType.GIT_COMMIT,
      user: os.userInfo().username,
      sessionId,
      details: { commitHash, message },
      success,
    });
  }

  logSessionStart(sessionId: string, projectPath: string): void {
    this.log({
      type: AuditEventType.SESSION_START,
      user: os.userInfo().username,
      sessionId,
      details: { projectPath },
      success: true,
    });
  }

  logSessionEnd(sessionId: string, success: boolean, stats?: Record<string, unknown>): void {
    this.log({
      type: AuditEventType.SESSION_END,
      user: os.userInfo().username,
      sessionId,
      details: stats || {},
      success,
    });
  }

  logError(error: Error, context: Record<string, unknown>, sessionId?: string): void {
    this.log({
      type: AuditEventType.ERROR,
      user: os.userInfo().username,
      sessionId,
      details: { message: error.message, stack: error.stack, ...context },
      success: false,
      error: error.message,
    });
  }

  private sanitizeArgs(args: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'api_key', 'authorization'];

    for (const [key, value] of Object.entries(args)) {
      const isSensitive = sensitiveKeys.some((k) => key.toLowerCase().includes(k));
      sanitized[key] = isSensitive ? '***REDACTED***' : value;
    }

    return sanitized;
  }

  async query(
    filters: {
      startDate?: string;
      endDate?: string;
      type?: AuditEventType;
      user?: string;
      sessionId?: string;
    },
    limit = 100
  ): Promise<AuditEvent[]> {
    const events: AuditEvent[] = [];
    const lines = await fs.promises.readFile(this.logPath, 'utf-8').then(
      (content) => content.split('\n').filter(Boolean),
      () => []
    );

    for (const line of lines) {
      try {
        const event = JSON.parse(line) as AuditEvent;

        if (filters.startDate && event.timestamp < filters.startDate) continue;
        if (filters.endDate && event.timestamp > filters.endDate) continue;
        if (filters.type && event.type !== filters.type) continue;
        if (filters.user && event.user !== filters.user) continue;
        if (filters.sessionId && event.sessionId !== filters.sessionId) continue;

        events.push(event);

        if (events.length >= limit) break;
      } catch {
        // Skip invalid lines
      }
    }

    return events;
  }

  closeLog(): void {
    this.close();
  }
}

/**
 * Coiote - Task File Runner
 *
 * Executa uma lista de tarefas de um arquivo markdown.
 * Cada tarefa e uma lista no arquivo.
 *
 * Referencia: coiote-orchestrator.md Secao 5 (Semanas 11-12)
 */

import fs from 'fs/promises';
import path from 'path';

export interface Task {
  title: string;
  description: string;
  completed: boolean;
  error?: string;
}

export class TaskFileRunner {
  async parseTasks(filePath: string): Promise<Task[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const tasks: Task[] = [];

    let currentTask: Partial<Task> = {};

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [')) {
        if (currentTask.title) {
          tasks.push(currentTask as Task);
        }
        const isCompleted = trimmed.startsWith('- [x]');
        currentTask = {
          title: trimmed.replace(/^-\s*\[\s*x?\s*\]\s*/, '').trim(),
          description: '',
          completed: isCompleted,
        };
      } else if (trimmed.startsWith('  -') && currentTask.title) {
        currentTask.description += ' ' + trimmed.replace(/^  -\s*/, '').trim();
      }
    }

    if (currentTask.title) {
      tasks.push(currentTask as Task);
    }

    return tasks;
  }

  async executeTasks(
    tasks: Task[],
    executor: (task: Task) => Promise<void>
  ): Promise<{ completed: number; failed: number; skipped: number }> {
    let completed = 0;
    let failed = 0;
    let skipped = 0;

    for (const task of tasks) {
      if (task.completed) {
        skipped++;
        continue;
      }

      try {
        await executor(task);
        task.completed = true;
        completed++;
      } catch (e) {
        task.error = e instanceof Error ? e.message : String(e);
        failed++;
      }
    }

    return { completed, failed, skipped };
  }

  static isTaskFile(args: string[]): string | null {
    const index = args.indexOf('--file');
    if (index === -1) return null;
    return args[index + 1] || null;
  }
}

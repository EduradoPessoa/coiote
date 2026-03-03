/**
 * Coiote - Headless Mode
 *
 * Implementa o modo headless para execucao em CI/CD.
 * Saida em JSON estruturado, sem prompts interativos.
 *
 * Referencia: coiote-orchestrator.md Secao 5 (Semanas 11-12)
 */

import { ExitCode, ExitCodeMapper } from '../utils/exit-codes.js';

export interface HeadlessOutput {
  success: boolean;
  exitCode: ExitCode;
  message: string;
  timestamp: string;
  duration?: number;
  stats?:
    | {
        filesModified?: number;
        iterations?: number;
        commandsRun?: number;
        tokensUsed?: number;
      }
    | undefined;
  errors?: string[];
  warnings?: string[];
}

export interface HeadlessOptions {
  outputFormat: 'json' | 'json-pretty';
  failOnWarning?: boolean;
}

export class HeadlessMode {
  private output: HeadlessOutput;
  private warnings: string[] = [];
  private startTime: number;

  constructor(private options: HeadlessOptions = { outputFormat: 'json' }) {
    this.startTime = Date.now();
    this.output = {
      success: false,
      exitCode: ExitCode.GENERAL_ERROR,
      message: '',
      timestamp: new Date().toISOString(),
    };
  }

  setMessage(message: string): void {
    this.output.message = message;
  }

  addWarning(warning: string): void {
    this.warnings.push(warning);
  }

  addError(error: string): void {
    if (!this.output.errors) {
      this.output.errors = [];
    }
    this.output.errors.push(error);
  }

  success(message: string, stats?: HeadlessOutput['stats']): void {
    this.output.success = true;
    this.output.exitCode = ExitCode.SUCCESS;
    this.output.message = message;
    this.output.duration = Date.now() - this.startTime;
    this.output.stats = stats ?? undefined;
    this.output.warnings = this.warnings;
    this.outputErrors();
  }

  fail(error: unknown, message?: string): void {
    this.output.success = false;
    this.output.exitCode = ExitCodeMapper.fromError(error);
    this.output.message = message || (error instanceof Error ? error.message : String(error));
    this.output.duration = Date.now() - this.startTime;
    this.output.errors = this.output.errors || [];
    if (error instanceof Error) {
      this.output.errors.push(error.message);
    }
    this.output.warnings = this.warnings;
    this.outputErrors();
  }

  private outputErrors(): void {
    const outputStr =
      this.options.outputFormat === 'json-pretty'
        ? JSON.stringify(this.output, null, 2)
        : JSON.stringify(this.output);

    console.log(outputStr);

    if (
      this.output.exitCode !== ExitCode.SUCCESS &&
      this.output.exitCode !== ExitCode.GENERAL_ERROR
    ) {
      process.exit(this.output.exitCode);
    } else if (!this.output.success) {
      process.exit(ExitCode.GENERAL_ERROR);
    }
  }

  static isHeadless(args: string[]): boolean {
    return args.includes('--headless') || args.includes('-H');
  }

  static parseArgs(args: string[]): HeadlessOptions {
    return {
      outputFormat: args.includes('--json-pretty') ? 'json-pretty' : 'json',
      failOnWarning: args.includes('--fail-on-warning'),
    };
  }
}

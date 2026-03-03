/**
 * Coiote - Animations
 *
 * Animações de transicao entre fases do loop agentico.
 * Suporta: spinner, loading, fade, slide, type
 *
 * Referencia: coiote-orchestrator.md Fase 4
 */

import chalk from 'chalk';
import cliSpinners from 'cli-spinners';

export type AnimationType = 'spinner' | 'progress' | 'typing' | 'fade' | 'slide';

export interface AnimationOptions {
  text?: string;
  frames?: string[];
  interval?: number;
  color?: chalk.Chalk;
}

export class SpinnerAnimation {
  private spinner: cliSpinners.Spinner;
  private interval: NodeJS.Timeout | null = null;
  private frameIndex = 0;
  private text: string;
  private color: chalk.Chalk;
  private isRunning = false;

  constructor(options: AnimationOptions = {}) {
    this.spinner = cliSpinners.dots;
    this.text = options.text || 'Processando';
    this.color = options.color || chalk.cyan;

    if (options.frames) {
      this.spinner = { frames: options.frames, interval: options.interval || 80 };
    }
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.interval = setInterval(() => {
      const frame = this.spinner.frames[this.frameIndex];
      const output = this.color(frame) + ' ' + this.text;
      process.stdout.write('\r' + output);
      this.frameIndex = (this.frameIndex + 1) % this.spinner.frames.length;
    }, this.spinner.interval);
  }

  stop(message?: string): void {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    process.stdout.write('\r' + ' '.repeat(50) + '\r');
    if (message) {
      console.log(message);
    }
  }

  updateText(text: string): void {
    this.text = text;
  }

  isActive(): boolean {
    return this.isRunning;
  }
}

export class ProgressAnimation {
  private current = 0;
  private total = 100;
  private width = 30;
  private color: chalk.Chalk;
  private showPercent = true;

  constructor(options: { width?: number; color?: chalk.Chalk; showPercent?: boolean } = {}) {
    this.width = options.width || 30;
    this.color = options.color || chalk.cyan;
    this.showPercent = options.showPercent !== false;
  }

  setProgress(current: number, total?: number): void {
    this.current = current;
    if (total !== undefined) this.total = total;
  }

  render(): string {
    const percent = Math.min(this.current / this.total, 1);
    const filled = Math.round(this.width * percent);
    const empty = this.width - filled;

    const bar = this.color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
    const percentText = Math.round(percent * 100);

    if (this.showPercent) {
      return '[' + bar + '] ' + percentText + '%';
    }
    return '[' + bar + ']';
  }

  print(): void {
    process.stdout.write('\r' + this.render());
  }

  complete(message?: string): void {
    process.stdout.write('\r' + ' '.repeat(50) + '\r');
    if (message) {
      console.log(message);
    }
  }
}

export class TypewriterEffect {
  private text: string;
  private delay: number;
  private cursor = '▋';
  private color?: chalk.Chalk;

  constructor(text: string, options: { delay?: number; color?: chalk.Chalk } = {}) {
    this.text = text;
    this.delay = options.delay || 30;
    this.color = options.color;
  }

  async run(): Promise<void> {
    for (let i = 0; i < this.text.length; i++) {
      const char = this.text[i];
      process.stdout.write(this.color ? this.color(char) : char);
      await this.sleep(this.delay);
    }
    console.log();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export class FadeEffect {
  private text: string;
  private steps = 5;
  private color?: chalk.Chalk;

  constructor(text: string, options: { steps?: number; color?: chalk.Chalk } = {}) {
    this.text = text;
    this.steps = options.steps || 5;
    this.color = options.color;
  }

  async run(): Promise<void> {
    const lines = this.text.split('\n');

    for (const line of lines) {
      for (let i = 0; i <= this.steps; i++) {
        const opacity = Math.round((i / this.steps) * 255)
          .toString(16)
          .padStart(2, '0');
        process.stdout.write('\r' + chalk.hex('#000000' + opacity)(line));
        await this.sleep(50);
      }
      console.log();
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export class SlideEffect {
  private text: string;
  private direction: 'left' | 'right' | 'up' | 'down';
  private color?: chalk.Chalk;

  constructor(
    text: string,
    options: { direction?: 'left' | 'right' | 'up' | 'down'; color?: chalk.Chalk } = {}
  ) {
    this.text = text;
    this.direction = options.direction || 'left';
    this.color = options.color;
  }

  run(): void {
    const lines = this.text.split('\n');

    switch (this.direction) {
      case 'left':
        for (const line of lines) {
          console.log(this.color ? this.color(line) : line);
        }
        break;
      case 'right':
        for (const line of lines) {
          console.log(' '.repeat(20) + (this.color ? this.color(line) : line));
        }
        break;
      default:
        console.log(this.color ? this.color(this.text) : this.text);
    }
  }
}

export class Animations {
  static spinner(options?: AnimationOptions): SpinnerAnimation {
    return new SpinnerAnimation(options);
  }

  static progress(options?: { width?: number; color?: chalk.Chalk }): ProgressAnimation {
    return new ProgressAnimation(options);
  }

  static typewriter(
    text: string,
    options?: { delay?: number; color?: chalk.Chalk }
  ): TypewriterEffect {
    return new TypewriterEffect(text, options);
  }

  static fade(text: string, options?: { steps?: number; color?: chalk.Chalk }): FadeEffect {
    return new FadeEffect(text, options);
  }

  static slide(
    text: string,
    options?: { direction?: 'left' | 'right' | 'up' | 'down'; color?: chalk.Chalk }
  ): SlideEffect {
    return new SlideEffect(text, options);
  }

  static loading(text = 'Carregando'): SpinnerAnimation {
    return new SpinnerAnimation({ text, color: chalk.cyan });
  }
}

export default Animations;

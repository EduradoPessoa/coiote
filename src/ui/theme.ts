/**
 * Coiote - Theme System
 *
 * Sistema de temas para a interface do terminal.
 * Suporta: auto (detectar), light, dark
 *
 * Referencia: coiote-orchestrator.md Fase 4
 */

import chalk from 'chalk';

export type ThemeMode = 'auto' | 'light' | 'dark';

export interface Theme {
  name: ThemeMode;
  colors: {
    primary: chalk.Chalk;
    secondary: chalk.Chalk;
    success: chalk.Chalk;
    warning: chalk.Chalk;
    error: chalk.Chalk;
    info: chalk.Chalk;
    muted: chalk.Chalk;
    highlight: chalk.Chalk;
    background?: chalk.Chalk;
  };
  icons: {
    info: string;
    success: string;
    warning: string;
    error: string;
    arrow: string;
    bullet: string;
  };
  borders: {
    single: string;
    double: string;
    round: string;
    bold: string;
  };
}

const darkTheme: Theme = {
  name: 'dark',
  colors: {
    primary: chalk.cyan,
    secondary: chalk.blue,
    success: chalk.green,
    warning: chalk.yellow,
    error: chalk.red,
    info: chalk.blue,
    muted: chalk.gray,
    highlight: chalk.white.bold,
  },
  icons: {
    info: 'ℹ',
    success: '✓',
    warning: '⚠',
    error: '✗',
    arrow: '›',
    bullet: '•',
  },
  borders: {
    single: '─',
    double: '═',
    round: '─',
    bold: '█',
  },
};

const lightTheme: Theme = {
  name: 'light',
  colors: {
    primary: chalk.blue,
    secondary: chalk.cyan,
    success: chalk.green,
    warning: chalk.yellow,
    error: chalk.red,
    info: chalk.blue,
    muted: chalk.gray,
    highlight: chalk.black.bold,
  },
  icons: {
    info: 'i',
    success: '√',
    warning: '!',
    error: 'x',
    arrow: '>',
    bullet: '-',
  },
  borders: {
    single: '-',
    double: '=',
    round: '-',
    bold: '#',
  },
};

function detectTheme(): ThemeMode {
  const env = process.env.THEME?.toLowerCase();
  if (env === 'light' || env === 'dark') return env;

  const term = (process.env.TERM_PROGRAM || process.env.TERM || '').toLowerCase();
  if (term.includes('light') || term.includes('apple')) return 'light';

  // Check for dark terminal colors
  if (term.includes('256') || term.includes('xterm') || term.includes('screen')) {
    return 'dark';
  }

  // Default to dark
  return 'dark';
}

export class ThemeManager {
  private currentTheme: Theme;
  private mode: ThemeMode;

  constructor(mode: ThemeMode = 'auto') {
    this.mode = mode;
    this.currentTheme =
      mode === 'auto'
        ? detectTheme() === 'dark'
          ? darkTheme
          : lightTheme
        : mode === 'dark'
          ? darkTheme
          : lightTheme;
  }

  get theme(): Theme {
    return this.currentTheme;
  }

  get modeName(): ThemeMode {
    return this.mode;
  }

  setTheme(mode: ThemeMode): void {
    this.mode = mode;
    this.currentTheme =
      mode === 'auto'
        ? detectTheme() === 'dark'
          ? darkTheme
          : lightTheme
        : mode === 'dark'
          ? darkTheme
          : lightTheme;
  }

  toggle(): void {
    this.setTheme(this.currentTheme.name === 'dark' ? 'light' : 'dark');
  }

  get color() {
    return this.currentTheme.colors;
  }

  get icon() {
    return this.currentTheme.icons;
  }

  get border() {
    return this.currentTheme.borders;
  }

  apply(content: string): string {
    return content;
  }
}

export const defaultTheme = new ThemeManager();

export function createTheme(mode?: ThemeMode): ThemeManager {
  return new ThemeManager(mode || 'auto');
}

export { darkTheme, lightTheme };

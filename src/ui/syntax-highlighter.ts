/**
 * Coiote - Syntax Highlighting
 *
 * Utilitario para destaque de sintaxe em blocos de codigo
 * no terminal usando ANSI escape codes.
 *
 * Referencia: coiote-stack.md Secao 3 (TUI)
 */

import chalk from 'chalk';

export type ThemeMode = 'auto' | 'light' | 'dark';

const themes = {
  dark: {
    keyword: chalk.cyan,
    string: chalk.green,
    number: chalk.yellow,
    comment: chalk.gray,
    function: chalk.blue,
    variable: chalk.white,
    operator: chalk.magenta,
    punctuation: chalk.gray,
    type: chalk.cyan,
    constant: chalk.yellow,
    property: chalk.cyan,
  },
  light: {
    keyword: chalk.blue.bold,
    string: chalk.green,
    number: chalk.red,
    comment: chalk.gray,
    function: chalk.blue,
    variable: chalk.black,
    operator: chalk.red,
    punctuation: chalk.gray,
    type: chalk.blue,
    constant: chalk.red.bold,
    property: chalk.blue,
  },
};

type TokenType = keyof typeof themes.dark;

interface TokenPattern {
  type: TokenType;
  pattern: RegExp;
}

const tokenPatterns: TokenPattern[] = [
  { type: 'comment', pattern: /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm },
  { type: 'string', pattern: /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g },
  { type: 'number', pattern: /\b\d+\.?\d*\b/g },
  {
    type: 'keyword',
    pattern:
      /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|extends|implements|type|interface|enum|public|private|protected|static|readonly|abstract|typeof|instanceof|in|of|default|switch|case|break|continue|void|null|undefined|true|false)\b/g,
  },
  { type: 'function', pattern: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g },
  { type: 'type', pattern: /\b([A-Z][a-zA-Z0-9_]*)\b/g },
  { type: 'operator', pattern: /([+\-*/%=<>!&|^~?:]+)/g },
  { type: 'punctuation', pattern: /([{}[\]();,.])/g },
];

function detectTheme(): 'dark' | 'light' {
  if (process.env.THEME === 'light') return 'light';
  if (process.env.THEME === 'dark') return 'dark';

  const term = process.env.TERM_PROGRAM || process.env.TERM || '';
  if (term.includes('light')) return 'light';

  return 'dark';
}

export class SyntaxHighlighter {
  private theme: 'dark' | 'light';

  constructor(mode: ThemeMode = 'auto') {
    this.theme = mode === 'auto' ? detectTheme() : mode;
  }

  setTheme(mode: ThemeMode): void {
    this.theme = mode === 'auto' ? detectTheme() : mode;
  }

  highlight(code: string, language?: string): string {
    const theme = themes[this.theme];

    let result = code;
    const replacements: { start: number; end: number; text: string }[] = [];

    for (const { type, pattern } of tokenPatterns) {
      const matches = code.matchAll(pattern);
      for (const match of matches) {
        if (match.index !== undefined) {
          const colorFn = theme[type];
          if (colorFn) {
            replacements.push({
              start: match.index,
              end: match.index + match[0].length,
              text: colorFn(match[0]),
            });
          }
        }
      }
    }

    replacements.sort((a, b) => b.start - a.start);

    for (const { start, end, text } of replacements) {
      result = result.slice(0, start) + text + result.slice(end);
    }

    return result;
  }

  highlightLine(line: string, lineNumber?: number): string {
    const highlighted = this.highlight(line);

    if (lineNumber !== undefined) {
      const numStr = String(lineNumber).padStart(3, ' ');
      return chalk.gray(numStr) + ' │ ' + highlighted;
    }

    return highlighted;
  }

  highlightBlock(code: string, language?: string): string {
    const lines = code.split('\n');
    const maxLineNum = String(lines.length).length;

    return lines
      .map((line, i) => {
        const lineNum = String(i + 1).padStart(maxLineNum, ' ');
        const highlighted = this.highlight(line);
        return chalk.gray(lineNum) + ' │ ' + highlighted;
      })
      .join('\n');
  }
}

export const syntaxHighlighter = new SyntaxHighlighter();

export function detectLanguage(filename: string): string | undefined {
  const ext = filename.split('.').pop()?.toLowerCase();

  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    kt: 'kotlin',
    cs: 'csharp',
    cpp: 'cpp',
    c: 'c',
    h: 'c',
    hpp: 'cpp',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    dockerfile: 'dockerfile',
  };

  return ext ? languageMap[ext] : undefined;
}

export function createCodeBlock(
  code: string,
  language?: string,
  options: {
    showLineNumbers?: boolean;
    theme?: ThemeMode;
    maxHeight?: number;
  } = {}
): string {
  const { showLineNumbers = true, theme = 'auto', maxHeight } = options;

  const highlighter = new SyntaxHighlighter(theme);
  const lang =
    language ||
    (typeof code === 'string' ? detectLanguage('file.' + (language || 'ts')) : undefined);

  let lines = code.split('\n');

  if (maxHeight && lines.length > maxHeight) {
    lines = lines.slice(0, maxHeight);
    lines.push('...');
  }

  const highlighted = lines.map((line, i) => {
    const lineNum = showLineNumbers ? String(i + 1).padStart(3, ' ') : '';
    return (lineNum ? chalk.gray(lineNum) + ' │ ' : '') + highlighter.highlight(line);
  });

  return highlighted.join('\n');
}

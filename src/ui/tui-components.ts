/**
 * Coiote - Enhanced TUI Components
 *
 * Componentes visuais ricos usando boxen.
 * Referencia: coiote-stack.md Secao 3 (TUI)
 */

import boxen from 'boxen';
import chalk from 'chalk';

export { boxen, chalk };

export interface BoxOptions {
  title?: string;
  borderColor?: string;
  borderStyle?: 'single' | 'double' | 'round' | 'bold' | 'classic';
  padding?: number | { top?: number; right?: number; bottom?: number; left?: number };
  margin?: number | { top?: number; right?: number; bottom?: number; left?: number };
  align?: 'left' | 'center' | 'right';
}

export interface TableRow {
  [key: string]: string | number | boolean;
}

export interface TableOptions {
  columns?: number;
  columnSpacing?: number;
  headerAlign?: 'left' | 'center' | 'right';
  rowAlign?: 'left' | 'center' | 'right';
  borders?: boolean;
}

const borderStyles: Record<string, any> = {
  single: 'single',
  double: 'double',
  round: 'round',
  bold: 'bold',
  classic: 'classic',
};

export class TUIComponents {
  static box(content: string, options: BoxOptions = {}): string {
    const {
      title,
      borderColor = 'cyan',
      borderStyle = 'single',
      padding = 1,
      margin = 0,
      align = 'left',
    } = options;

    const colorFn =
      ((chalk as unknown as Record<string, unknown>)[borderColor] as
        | ((s: string) => string)
        | undefined) || chalk.cyan;

    const boxOptions: Record<string, unknown> = {
      borderStyle: borderStyles[borderStyle] || 'single',
      padding: typeof padding === 'number' ? padding : padding,
      margin: typeof margin === 'number' ? margin : margin,
      align: align,
    };
    if (title) {
      boxOptions.title = colorFn(title);
    }

    return boxen(content, boxOptions);
  }

  static alert(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): string {
    const icons = {
      info: chalk.blue('i'),
      success: chalk.green('√'),
      warning: chalk.yellow('!'),
      error: chalk.red('x'),
    };

    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red,
    };

    const icon = icons[type];
    const colorFn = colors[type];

    return this.box(colorFn(icon + ' ' + message), {
      borderColor: type === 'info' ? 'blue' : type,
      borderStyle: 'round',
      padding: 0,
    });
  }

  static header(text: string, width = 60): string {
    const line = chalk.gray('─'.repeat(width));
    return '\n' + line + '\n' + chalk.bold.cyan(text) + '\n' + line + '\n';
  }

  static footer(text: string, width = 60): string {
    const line = chalk.gray('─'.repeat(width));
    return '\n' + line + '\n' + chalk.gray(text) + '\n';
  }

  static table(rows: TableRow[], options: TableOptions = {}): string {
    if (rows.length === 0) return '';

    const { columnSpacing = 2, headerAlign = 'left', borders = true } = options;

    const headers = rows[0] ? Object.keys(rows[0]) : [];
    if (headers.length === 0) return '';

    const colWidths: number[] = headers.map((h) => h.length);

    for (const row of rows) {
      headers.forEach((h, i) => {
        const valLen = String(row[h]).length;
        const currentWidth = colWidths[i];
        if (currentWidth !== undefined) {
          colWidths[i] = Math.max(currentWidth, valLen);
        }
      });
    }

    const buildRow = (cells: string[], align: 'left' | 'center' | 'right') => {
      return cells
        .map((cell, i) => {
          const width = colWidths[i] ?? 0;
          const pad = ' '.repeat(width - cell.length + columnSpacing);
          if (align === 'right') return pad + cell;
          if (align === 'center') {
            const leftPad = Math.floor(pad.length / 2);
            return ' '.repeat(leftPad) + cell + ' '.repeat(pad.length - leftPad);
          }
          return cell + pad;
        })
        .join('');
    };

    const headerCells = headers.map((h) => chalk.bold.cyan(h));
    let output = buildRow(headerCells, headerAlign) + '\n';

    if (borders) {
      output += chalk.gray('─'.repeat(colWidths.reduce((a, b) => a + b + columnSpacing, 0))) + '\n';
    }

    for (const row of rows) {
      const cells = headers.map((h) => String(row[h]));
      output += buildRow(cells, 'left') + '\n';
    }

    return output;
  }

  static list(
    items: string[],
    options: { numbered?: boolean; bullet?: string; color?: (s: string) => string } = {}
  ): string {
    const { numbered = false, bullet = '•', color } = options;

    return items
      .map((item, i) => {
        const prefix = numbered ? i + 1 + '.' : bullet;
        const coloredItem = color ? color(item) : chalk.white(item);
        return chalk.gray(prefix) + ' ' + coloredItem;
      })
      .join('\n');
  }

  static progressBar(current: number, total: number, width = 30): string {
    const percent = Math.min(current / total, 1);
    const filled = Math.round(width * percent);
    const empty = width - filled;

    const bar = chalk.cyan('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
    const percentText = Math.round(percent * 100)
      .toString()
      .padStart(3, ' ');

    return '[' + bar + '] ' + percentText + '%';
  }

  static spinner(
    text: string,
    frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  ): () => string {
    let i = 0;
    return () => {
      const frame = chalk.cyan(frames[i % frames.length]);
      i++;
      return frame + ' ' + text;
    };
  }

  static divider(char = '─', color = 'gray'): string {
    const colorFn = (chalk as unknown as Record<string, unknown>)[color] as
      | ((s: string) => string)
      | undefined;
    return colorFn?.(char.repeat(50)) || chalk.gray(char.repeat(50));
  }

  static section(title: string, content: string): string {
    return this.header(title) + content + this.footer('');
  }

  static codeBlock(code: string, language = ''): string {
    const lines = code.split('\n');
    const maxLineNum = String(lines.length).length;

    const numbered = lines
      .map((line, i) => {
        const num = String(i + 1).padStart(maxLineNum, ' ');
        return chalk.gray(num) + ' │ ' + line;
      })
      .join('\n');

    return this.box(numbered, {
      borderColor: 'gray',
      borderStyle: 'classic',
      padding: 0,
    });
  }

  static confirm(message: string): string {
    return this.box(chalk.yellow('? ') + message, {
      borderColor: 'yellow',
      borderStyle: 'round',
      padding: 0,
    });
  }
}

export default TUIComponents;

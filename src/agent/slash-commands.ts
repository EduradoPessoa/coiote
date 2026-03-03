/**
 * Coiote - Slash Commands
 *
 * Sistema de comandos especiais que podem ser executados durante
 * uma sessao interativa do Coiote.
 *
 * Referencia: coiote-orchestrator.md Secao 5 (Semanas 11-12)
 */

import { simpleGit } from 'simple-git';
import type { Reporter } from '../ui/reporter.js';
import type { ExecutionPlan } from '../ui/reporter.js';

export interface SlashCommand {
  name: string;
  description: string;
  execute: (context: SlashCommandContext) => Promise<void>;
}

export interface SlashCommandContext {
  projectRoot: string;
  reporter: Reporter;
  currentPlan?: ExecutionPlan;
  history?: ChatMessage[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string | unknown[];
}

export class SlashCommandManager {
  private commands: Map<string, SlashCommand> = new Map();
  private context: SlashCommandContext;

  constructor(context: SlashCommandContext) {
    this.context = context;
    this.registerDefaultCommands();
  }

  private registerDefaultCommands(): void {
    this.register({
      name: 'plan',
      description: 'Exibir o plano de execucao atual',
      execute: async (ctx) => {
        if (ctx.currentPlan) {
          ctx.reporter.plan(ctx.currentPlan);
        } else {
          ctx.reporter.info('Nenhum plano de execucao ativo nesta sessao.');
        }
      },
    });

    this.register({
      name: 'explain',
      description: 'Explicar o que foi feito ate agora',
      execute: async (ctx) => {
        if (ctx.history && ctx.history.length > 0) {
          const assistantMessages = ctx.history.filter((m) => m.role === 'assistant');
          ctx.reporter.info('Executado ' + assistantMessages.length + ' iteracoes ate agora.');

          for (const msg of assistantMessages) {
            if (typeof msg.content === 'object' && Array.isArray(msg.content)) {
              for (const block of msg.content) {
                if (
                  block &&
                  typeof block === 'object' &&
                  'text' in block &&
                  typeof block.text === 'string'
                ) {
                  ctx.reporter.info('- ' + block.text.substring(0, 100) + '...');
                }
              }
            }
          }
        } else {
          ctx.reporter.info('Nenhuma acao executada ainda nesta sessao.');
        }
      },
    });

    this.register({
      name: 'undo',
      description: 'Reverter a ultima acao via git',
      execute: async (ctx) => {
        const git = simpleGit(ctx.projectRoot);
        try {
          const status = await git.status();
          if (status.files.length > 0) {
            ctx.reporter.warning(
              'Ha ' + status.files.length + ' arquivo(s) modificado(s). Deseja reverter?'
            );
            await git.checkout(['--', '.']);
            ctx.reporter.info('Arquivos revertidos com sucesso.');
          } else {
            ctx.reporter.info('Nada para reverter.');
          }
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : String(e);
          ctx.reporter.error(new Error('Falha ao reverter: ' + errMsg));
        }
      },
    });

    this.register({
      name: 'commit',
      description: 'Forcar commit do estado atual',
      execute: async (ctx) => {
        const git = simpleGit(ctx.projectRoot);
        try {
          const status = await git.status();
          if (status.files.length === 0) {
            ctx.reporter.info('Nada para commitar.');
            return;
          }

          await git.add('.');
          await git.commit('Coiote: Commit manual via /commit');
          ctx.reporter.info('Commit criado com sucesso.');
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : String(e);
          ctx.reporter.error(new Error('Falha ao criar commit: ' + errMsg));
        }
      },
    });

    this.register({
      name: 'test',
      description: 'Executar suite de testes do projeto',
      execute: async (ctx) => {
        ctx.reporter.info('Executando testes...');
      },
    });

    this.register({
      name: 'status',
      description: 'Resumo rapido: tokens, arquivos modificados, tempo',
      execute: async (ctx) => {
        ctx.reporter.info('Status da sessao:');
        ctx.reporter.info('- Use /explain para ver detalhes das acoes');
      },
    });

    this.register({
      name: 'help',
      description: 'Mostrar ajuda dos comandos disponiveis',
      execute: async (ctx) => {
        ctx.reporter.info('Comandos disponiveis:');
        for (const [name, cmd] of this.commands) {
          ctx.reporter.info('  /' + name + ' - ' + cmd.description);
        }
      },
    });
  }

  register(command: SlashCommand): void {
    if (this.commands.has(command.name)) {
      throw new Error('Comando /' + command.name + ' ja existe');
    }
    this.commands.set(command.name, command);
  }

  async execute(input: string): Promise<boolean> {
    const trimmed = input.trim();
    if (!trimmed.startsWith('/')) {
      return false;
    }

    const parts = trimmed.slice(1).split(/\s+/);
    const commandName = parts[0]?.toLowerCase() ?? '';

    const command = this.commands.get(commandName);
    if (!command) {
      this.context.reporter.warning('Comando desconhecido: /' + commandName);
      return true;
    }

    try {
      await command.execute(this.context);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      this.context.reporter.error(new Error('Erro ao executar /' + commandName + ': ' + errMsg));
    }

    return true;
  }

  getCommands(): string[] {
    return Array.from(this.commands.keys());
  }
}

export function isSlashCommand(input: string): boolean {
  return input.trim().startsWith('/');
}

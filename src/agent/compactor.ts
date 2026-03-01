import type { LLMProvider, ChatMessage } from '../providers/types.js';
import type { Reporter } from '../ui/reporter.js';
import { promptConfirm } from '../ui/prompts.js';

export interface CompactionResult {
    compactedHistory: ChatMessage[];
    summary: string;
}

export class ContextCompactor {
    constructor(
        private provider: LLMProvider,
        private reporter: Reporter
    ) { }

    /**
     * Compacta o histórico de mensagens em um resumo para economizar espaço de contexto.
     * @param history Histórico completo de mensagens
     * @returns Um novo histórico começando com o resumo
     */
    async compact(history: ChatMessage[]): Promise<CompactionResult> {
        this.reporter.warning('O limite de contexto está próximo. Iniciando compactação de histórico...');

        // Filtra ferramentas e resultados intermediários para o resumo, foca no que foi feito
        const messagesToSummarize = history.map(m => {
            if (typeof m.content === 'string') return `${m.role}: ${m.content}`;
            return `${m.role}: [Ações complexas/Ferramentas]`;
        }).join('\n');

        const compactionPrompt = `
Por favor, resuma o histórico de conversas acima em um parágrafo denso e técnico.
Foque em:
1. O que o usuário solicitou originalmente.
2. Quais arquivos foram modificados ou criados.
3. Quais comandos foram executados.
4. Qual o estado atual do projeto.

Seu resumo será usado como o novo ponto de partida da conversa para economizar espaço de contexto.
Seja direto e objetivo.
`;

        const confirm = await promptConfirm('Deseja compactar o histórico para economizar tokens? Os detalhes das ferramentas intermediárias serão resumidos.', true);
        if (!confirm) {
            this.reporter.info('Compactação cancelada pelo usuário. Continuando com histórico completo (risco de erro de contexto).');
            return { compactedHistory: history, summary: '' };
        }

        this.reporter.info('Gerando resumo técnico de histórico...');

        let summary = '';
        // Usamos o stream mas coletamos tudo para o resumo
        const stream = this.provider.stream({
            messages: [
                { role: 'user', content: `Histórico:\n${messagesToSummarize}\n\n${compactionPrompt}` }
            ],
            system: 'Você é um assistente técnico especializado em resumir sessões de desenvolvimento para economia de contexto.'
        });

        for await (const chunk of stream) {
            if (chunk.type === 'text' && chunk.text) {
                summary += chunk.text;
            }
        }

        const compactedMessage: ChatMessage = {
            role: 'user',
            content: `[HISTÓRICO COMPACTADO]\nResumo das ações anteriores:\n${summary}\n\nPor favor, continue a partir deste ponto.`
        };

        this.reporter.info('Histórico compactado com sucesso.');

        return {
            compactedHistory: [compactedMessage],
            summary
        };
    }
}

import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider, ChatParams, StreamEvent } from './types.js';
import { ProviderError } from '../errors.js';
import { withRetry } from '../utils/retry.js';

export class AnthropicProvider implements LLMProvider {
    public name = 'anthropic';
    public supportsToolUse = true;
    private client: Anthropic;
    private model: string;

    constructor(apiKey: string, model: string = 'claude-3-5-sonnet-latest') {
        if (!apiKey) {
            throw new ProviderError(this.name, 'API Key da Anthropic não fornecida', 'PROVIDER_AUTH_FAILED' as any);
        }
        this.client = new Anthropic({ apiKey });
        this.model = model;
    }

    async *stream(params: ChatParams): AsyncIterable<StreamEvent> {
        try {
            const streamParams: any = {
                model: this.model,
                max_tokens: 8192,
                messages: params.messages,
                tools: params.tools,
            };
            if (params.system) {
                streamParams.system = params.system;
            }

            const stream = await this.client.messages.stream(streamParams);

            for await (const event of stream) {
                if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                    yield { type: 'text', text: event.delta.text };
                } else if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
                    // O iterador completo de tool usa content_block_delta para os args.
                    // Na abstração final, o `AnthropicProvider` de verdade precisa agrupar os deltas do json
                    // Por enquanto, delegamos a complexidade de reconstruir args ao sdk via `stream.finalMessage()` ou 
                    // emitimos um placeholder. Para usar tool_use na Phase 1:
                    // O evento final `message` de um stream contem todos os content_blocks prontos.
                }
            }

            const finalMessage = await stream.finalMessage();

            // Se houver tool calls na resposta final, emitimos agora
            for (const block of finalMessage.content) {
                if (block.type === 'tool_use') {
                    yield {
                        type: 'tool_use',
                        toolCall: {
                            id: block.id,
                            name: block.name,
                            input: block.input,
                        }
                    };
                }
            }

            yield { type: 'done' };

        } catch (e: any) {
            throw new ProviderError(
                this.name,
                `Erro de API Anthropic: ${e.message}`,
                'PROVIDER_API_ERROR' as any,
                e.status
            );
        }
    }
}

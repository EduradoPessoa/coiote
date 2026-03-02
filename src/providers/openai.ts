import OpenAI from 'openai';
import type { LLMProvider, ChatParams, StreamEvent } from './types.js';
import { ProviderError } from '../errors.js';
import { withRetry } from '../utils/retry.js';

export class OpenAIProvider implements LLMProvider {
    public name = 'openai';
    public supportsToolUse = true;
    private client: OpenAI;
    private model: string;

    constructor(apiKey: string, model: string = 'gpt-4o', baseURL?: string) {
        if (!apiKey && !baseURL?.includes('localhost')) {
            throw new ProviderError(this.name, 'API Key da OpenAI não fornecida', 'PROVIDER_AUTH_FAILED' as any);
        }
        this.client = new OpenAI({
            apiKey: apiKey || 'empty',
            baseURL
        });
        this.model = model;
    }

    async *stream(params: ChatParams): AsyncIterable<StreamEvent> {
        try {
            const messages: any[] = [];

            if (params.system) {
                messages.push({ role: 'system', content: params.system });
            }

            for (const msg of params.messages) {
                messages.push({
                    role: msg.role,
                    content: msg.content
                });
            }

            const streamParams: any = {
                model: this.model,
                messages,
                stream: true,
            };

            if (params.tools) {
                streamParams.tools = params.tools.map(t => ({
                    type: 'function',
                    function: {
                        name: t.name,
                        description: t.description || undefined,
                        parameters: t.input_schema as any
                    }
                }));
            }

            const stream = await withRetry(() => this.client.chat.completions.create(streamParams)) as any;

            const toolCalls: any[] = [];

            for await (const chunk of stream) {
                const delta = chunk.choices[0]?.delta;

                if (delta?.content) {
                    yield { type: 'text', text: delta.content };
                }

                if (delta?.tool_calls) {
                    for (const tc of delta.tool_calls) {
                        if (!toolCalls[tc.index]) {
                            toolCalls[tc.index] = {
                                id: tc.id,
                                name: tc.function?.name,
                                arguments: ''
                            };
                        }
                        if (tc.function?.arguments) {
                            toolCalls[tc.index].arguments += tc.function.arguments;
                        }
                        if (tc.id) {
                            toolCalls[tc.index].id = tc.id;
                        }
                    }
                }
            }

            // Emitir tool calls completos ao final do stream
            for (const tc of toolCalls) {
                if (tc) {
                    yield {
                        type: 'tool_use',
                        toolCall: {
                            id: tc.id,
                            name: tc.name,
                            input: JSON.parse(tc.arguments || '{}')
                        }
                    };
                }
            }

            yield { type: 'done' };

        } catch (e: any) {
            throw new ProviderError(
                this.name,
                `Erro de API OpenAI: ${e.message}`,
                'PROVIDER_API_ERROR' as any,
                e.status
            );
        }
    }
}

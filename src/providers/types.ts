import type { Tool as AnthropicTool } from '@anthropic-ai/sdk/resources/messages.js';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string | Array<any>;
}

export interface StreamEvent {
    type: 'text' | 'tool_use' | 'tool_result' | 'error' | 'done';
    text?: string;
    toolCall?: {
        id: string;
        name: string;
        input: unknown;
    };
    error?: string;
}

export interface ChatParams {
    messages: ChatMessage[];
    system?: string;
    tools?: AnthropicTool[];
}

export interface LLMProvider {
    name: string;
    stream(params: ChatParams): AsyncIterable<StreamEvent>;
    supportsToolUse: boolean;
}

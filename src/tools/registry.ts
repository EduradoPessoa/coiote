import type { Tool } from './types.js';
import type { Tool as AnthropicTool } from '@anthropic-ai/sdk/resources/messages.js';

export class ToolRegistry {
    private tools = new Map<string, Tool<unknown, unknown>>();

    register(tool: Tool<unknown, unknown>): void {
        if (this.tools.has(tool.name)) {
            throw new Error(`Tool '${tool.name}' já está registrada`);
        }
        this.tools.set(tool.name, tool);
    }

    get(name: string): Tool<unknown, unknown> {
        const tool = this.tools.get(name);
        if (!tool) throw new Error(`Tool desconhecida: ${name}`);
        return tool;
    }

    // Converte para formato que a API do Anthropic Claude entende
    toAnthropicFormat(): AnthropicTool[] {
        return [...this.tools.values()].map((tool) => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.inputSchema,
        }));
    }
}

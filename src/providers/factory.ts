import { AnthropicProvider, OpenAIProvider, OllamaProvider } from './index.js';
import type { LLMProvider } from './types.js';
import type { KeyManager } from '../config/key-manager.js';
import { ProviderError } from '../errors.js';

export class ProviderFactory {
    static async create(
        providerName: string,
        model: string,
        keyManager: KeyManager
    ): Promise<LLMProvider> {
        switch (providerName.toLowerCase()) {
            case 'anthropic': {
                const key = await keyManager.getKey('anthropic');
                if (!key) throw new ProviderError('anthropic', 'Chave Anthropic não encontrada');
                return new AnthropicProvider(key, model);
            }
            case 'openai': {
                const key = await keyManager.getKey('openai');
                if (!key) throw new ProviderError('openai', 'Chave OpenAI não encontrada');
                return new OpenAIProvider(key, model);
            }
            case 'ollama': {
                return new OllamaProvider(model);
            }
            case 'deepseek': {
                const key = await keyManager.getKey('openai'); // Ou 'deepseek' se separado
                return new OpenAIProvider(key || '', model, 'https://api.deepseek.com');
            }
            case 'gemini': {
                const key = await keyManager.getKey('openai'); // Via adaptador OpenAI
                return new OpenAIProvider(key || '', model, 'https://generativelanguage.googleapis.com/v1beta/openai/');
            }
            default:
                throw new Error(`Provider desconhecido: ${providerName}`);
        }
    }
}

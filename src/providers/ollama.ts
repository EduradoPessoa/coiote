import { OpenAIProvider } from './openai.js';

export class OllamaProvider extends OpenAIProvider {
    public override name = 'ollama';

    constructor(model: string = 'llama3', baseURL: string = 'http://localhost:11434/v1') {
        // Ollama local geralmente não precisa de API Key para acesso local
        super('ollama', model, baseURL);
    }
}

import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { ConfigurationError } from '../errors.js';

export class KeyManager {
    private keysPath: string;

    constructor(customPath?: string) {
        // ~/.coiote/keys.json 
        this.keysPath = customPath || path.join(os.homedir(), '.coiote', 'keys.json');
    }

    isValidApiKey(provider: string, key: string): boolean {
        const patterns: Record<string, RegExp> = {
            anthropic: /^sk-ant-[a-zA-Z0-9\-_]+$/,
            openai: /^sk-[a-zA-Z0-9]+$/,
        };
        return patterns[provider]?.test(key) ?? key.length > 20;
    }

    async storeKey(provider: string, key: string): Promise<void> {
        const sanitized = key.trim();
        if (!this.isValidApiKey(provider, sanitized)) {
            throw new ConfigurationError(`Formato de chave inválido para ${provider}`);
        }

        // fallback criptografado seria usado aqui
        await this.storeKeyEncrypted(provider, sanitized);
    }

    async getKey(provider: string): Promise<string | null> {
        // 1. Variável de ambiente - precedência máxima
        if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
            return process.env.ANTHROPIC_API_KEY;
        }
        if (provider === 'openai' && process.env.OPENAI_API_KEY) {
            return process.env.OPENAI_API_KEY;
        }

        // 2. Fallback: arquivo "seguro"
        return await this.getKeyDecrypted(provider);
    }

    // Nas próximas semanas: criptografia via crypto nativo com UID da máquina
    private async storeKeyEncrypted(provider: string, key: string): Promise<void> {
        const keys = await this.readKeys();
        keys[provider] = key; // Plaintext como step intermediário pra Fase 1 mock; será criptografado
        await fs.outputJson(this.keysPath, keys, { spaces: 2, mode: 0o600 }); // mode 600 - so o dono lê
    }

    private async getKeyDecrypted(provider: string): Promise<string | null> {
        const keys = await this.readKeys();
        return keys[provider] || null;
    }

    private async readKeys(): Promise<Record<string, string>> {
        try {
            if (await fs.pathExists(this.keysPath)) {
                return await fs.readJson(this.keysPath);
            }
        } catch {
            // ignore JSON parse errors
        }
        return {};
    }
}

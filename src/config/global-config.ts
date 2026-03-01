import Conf from 'conf';

export interface GlobalConfigSchema {
    defaultProvider: 'anthropic' | 'openai' | 'ollama';
    defaultModel: string;
    defaultPermissionLevel: 'ask-all' | 'ask-destructive' | 'auto';
    autoCommit: boolean;
    verbosity: 'quiet' | 'normal' | 'verbose';
}

const configSchema: any = {
    defaultProvider: { type: 'string', default: 'anthropic' },
    defaultModel: { type: 'string', default: 'claude-3-7-sonnet-20250219' }, // Atualizado para suportado local
    defaultPermissionLevel: { type: 'string', default: 'ask-all' },
    autoCommit: { type: 'boolean', default: false },
    verbosity: { type: 'string', default: 'normal' },
};

export class GlobalConfig {
    private conf: Conf<GlobalConfigSchema>;

    constructor() {
        this.conf = new Conf({
            projectName: 'coiote',
            schema: configSchema,
        });
    }

    get<K extends keyof GlobalConfigSchema>(key: K): GlobalConfigSchema[K] {
        return this.conf.get(key);
    }

    set<K extends keyof GlobalConfigSchema>(key: K, value: GlobalConfigSchema[K]): void {
        this.conf.set(key, value);
    }

    getAll(): GlobalConfigSchema {
        return this.conf.store;
    }
}

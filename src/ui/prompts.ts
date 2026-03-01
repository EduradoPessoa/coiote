import { confirm, input, select } from '@inquirer/prompts';

export async function promptConfirm(message: string, defaultAnswer = true): Promise<boolean> {
    return confirm({
        message,
        default: defaultAnswer,
    });
}

export async function promptHighRisk(message: string, expectedWord: string): Promise<boolean> {
    const answer = await input({
        message: `${message}\n  Para confirmar, digite: ${expectedWord}\n  Para cancelar, pressione Enter.`,
    });
    return answer.trim() === expectedWord;
}

export async function promptSelectRecovery(options: { label: string; value: string }[]): Promise<string> {
    return select({
        message: 'O que prefere fazer?',
        choices: options.map(opt => ({
            name: opt.label,
            value: opt.value,
        })),
    });
}

export async function promptSessionMode(): Promise<'ask-all' | 'ask-destructive' | 'auto'> {
    return select({
        message: 'Como você quer que o Coiote opere nesta sessão?',
        choices: [
            {
                name: 'Perguntar antes de cada ação (mais seguro)',
                value: 'ask-all',
            },
            {
                name: 'Perguntar apenas para mudanças destrutivas (recomendado)',
                value: 'ask-destructive',
            },
            {
                name: 'Modo automático — executar tudo sem confirmação (use com cuidado)',
                value: 'auto',
            },
        ],
    });
}

export class LoopProtector {
    private history: string[] = [];
    private readonly maxDuplicates = 3;

    /**
     * Verifica se estamos em um loop infinito baseado na repetição de ações.
     * @param toolName Nome da ferramenta
     * @param inputJson JSON dos argumentos
     * @returns true se um loop for detectado
     */
    check(toolName: string, inputJson: string): boolean {
        const actionKey = `${toolName}:${inputJson}`;
        this.history.push(actionKey);

        // Mantemos apenas os últimos 10 comandos para análise de loop
        if (this.history.length > 10) {
            this.history.shift();
        }

        // Conta ocorrências da ação atual no histórico recente
        const occurrences = this.history.filter(a => a === actionKey).length;

        return occurrences >= this.maxDuplicates;
    }
}

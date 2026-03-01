/**
 * Detecta padrões de Prompt Injection em arquivos de contexto.
 */
const INJECTION_PATTERNS = [
    /ignore (all |previous |above )?instructions/i,
    /new system prompt/i,
    /você (agora |deve )?ignorar/i,
    /\[SYSTEM\]/i,
    /\[INSTRUÇÃO\]/i,
    /execute.*curl.*\$\(/i,           // Exfiltração via curl
    /cat\s+\.env\s*[|>]/i             // Leitura de .env
];

export interface ScanResult {
    safe: boolean;
    findings: string[];
}

export function scanForInjection(content: string, filePath?: string): ScanResult {
    const findings: string[] = [];

    for (const pattern of INJECTION_PATTERNS) {
        const match = content.match(pattern);
        if (match) {
            findings.push(`Padrao suspecto detectado: ${match[0]}`);
        }
    }

    return {
        safe: findings.length === 0,
        findings
    };
}

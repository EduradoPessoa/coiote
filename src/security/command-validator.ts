export interface ValidationResult {
    allowed: boolean;
    reason?: string;
    severity: 'blocked' | 'high' | 'medium' | 'low';
    requiresExtraConfirmation?: boolean;
}

const BLOCKED_COMMANDS = new Set([
    'rm', 'rmdir', 'del', 'format',      // Deleção (só via tool delete_file)
    'sudo', 'su', 'doas',                 // Escalada de privilégio
    'chmod', 'chown', 'chattr',           // Mudança de permissões críticas
    'crontab', 'at', 'systemctl',         // Persistência no sistema
    'iptables', 'ufw', 'firewall-cmd',   // Firewall
    'ssh-keygen', 'ssh-copy-id',          // Chaves SSH
    'gpg', 'openssl',                     // Criptografia (pode gerar chaves)
    'dd',                                 // Escrita em dispositivos raw
    'mkfs', 'mount', 'umount',            // Sistema de arquivos
    'reboot', 'shutdown', 'halt',         // Sistema
    'passwd', 'useradd', 'usermod',       // Gerenciamento de usuários
    'curl', 'wget', 'fetch',              // Rede (requer aprovação explícita)
]);

const SENSITIVE_PATTERNS = [
    /\.env/i,                             // Arquivos .env
    /\/etc\/passwd/i,
    /\/etc\/shadow/i,
    /(>|>>)\s*\/dev\/sd/,                // Escrita em dispositivos
    /\|\s*(curl|wget|nc|netcat)/,        // Pipe para rede
    /base64\s+.*\|\s*(curl|wget)/,       // Exfiltração encoded
    /\$\(/,                              // Command substitution (alto risco)
    /`[^`]+`/,                           // Backtick substitution
    /eval\s/,                            // eval
];

// Parser simples para pegar o base command
function parseCommand(cmd: string): string[] {
    // Ignora env vars no inicio ex: FOO=bar node index.js
    const stripped = cmd.replace(/^([a-zA-Z0-9_]+=[^\s]+\s+)+/, '').trim();
    const parts = stripped.split(/\s+/);
    return parts;
}

export function validateCommand(cmd: string): ValidationResult {
    const parts = parseCommand(cmd);
    const baseCommand = parts[0]?.toLowerCase() ?? '';

    if (BLOCKED_COMMANDS.has(baseCommand)) {
        return {
            allowed: false,
            reason: `Comando '${baseCommand}' não é permitido. Use as ferramentas específicas do Coiote.`,
            severity: 'blocked',
        };
    }

    for (const pattern of SENSITIVE_PATTERNS) {
        if (pattern.test(cmd)) {
            return {
                allowed: false,
                reason: `Padrão de risco detectado no comando: ${pattern.source}`,
                severity: 'high',
            };
        }
    }

    // Comandos de rede e gerenciadores de pacotes requerem confirmação extra se estivermos usando policy rigida
    const networkCommands = ['npm', 'pnpm', 'yarn', 'pip', 'apt', 'brew'];
    if (networkCommands.includes(baseCommand)) {
        return { allowed: true, requiresExtraConfirmation: true, severity: 'medium' };
    }

    return { allowed: true, severity: 'low' };
}

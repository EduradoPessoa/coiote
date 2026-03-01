import path from 'path';

export interface ValidatedPath {
    absolute: string;
    relative: string;
}

export const SENSITIVE_PATTERNS = [
    /^\.env(\.|$)/i,
    /^\.git\//,                    // Internals do git
    /\.(pem|key|p12|pfx|crt)$/i,  // Certificados e chaves
    /^secrets?\//i,
    /private\.key$/i,
];

export function isSensitivePath(absolutePath: string): boolean {
    const filename = path.basename(absolutePath);
    return SENSITIVE_PATTERNS.some(p => p.test(filename));
}

export function validatePath(userPath: string, projectRoot: string): ValidatedPath {
    // Resolver caminho absoluto
    const resolved = path.resolve(projectRoot, userPath);

    // Verificar que está dentro do projeto
    const relative = path.relative(projectRoot, resolved);
    const isOutside = relative.startsWith('..') || path.isAbsolute(relative);

    if (isOutside) {
        throw new Error(`Path traversal detectado: '${userPath}' está fora do projeto.`);
    }

    // Verificar contra lista de arquivos sensíveis
    if (isSensitivePath(resolved)) {
        throw new Error(`Acesso bloqueado a arquivo sensível: ${relative}`);
    }

    return { absolute: resolved, relative };
}

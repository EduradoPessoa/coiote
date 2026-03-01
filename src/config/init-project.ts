import fs from 'fs-extra';
import path from 'path';

export const INIT_TEMPLATE = `# Coiote — Configurações do Projeto

## Contexto do Projeto
Descreva aqui do que se trata o projeto de forma bem direta e de alto nível para o agente LLM.
(Ex: API Node com Express ou Frontend Crieato em Next.js e Tailwind).

## Comandos
- Testes: \`npm test\`
- Build: \`npm run build\`
- Lint: \`npm run lint\`

## Convenções
- Usar TypeScript com tipagem strict
- Funções assíncronas em toda rotina de I/O
- Commits no padrão Conventional Commits em português

## Permissões
### Aprovação automática
- Leitura de diretórios abertos
- pnpm test

### Sempre confirmar
- Dependências novas (npm install, pnpm add)
- Modificação de arquivos críticos de setup (package.json, tsconfig.json)

### Nunca fazer
- Instalações globais no OS
- Modificar senhas ou apagar .env

### Arquivos sensíveis
- .env
- .env.*
- secrets/
- *.pem
`;

export async function initializeProject(projectRoot: string): Promise<boolean> {
    const target = path.join(projectRoot, 'coiote.config.md');

    if (await fs.pathExists(target)) {
        return false; // Ja existe
    }

    await fs.outputFile(target, INIT_TEMPLATE);
    return true;
}

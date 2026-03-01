/**
 * 🐺 Coiote CLI — Configuração de comandos com Commander
 *
 * Parse de argumentos, help, version e routing de comandos.
 */

import { createRequire } from 'module';
import { Command } from 'commander';

interface PackageJson {
    version: string;
    description: string;
}

function loadPackageJson(): PackageJson {
    const require = createRequire(import.meta.url);
    return require('../package.json') as PackageJson;
}

export function createProgram(): Command {
    const pkg = loadPackageJson();

    const program = new Command();

    program
        .name('coiote')
        .description(pkg.description)
        .version(pkg.version, '-V, --version', 'Exibir versão do Coiote')
        .helpOption('-h, --help', 'Exibir ajuda')
        .argument('[prompt]', 'Tarefa a executar em linguagem natural')
        .option('-m, --model <model>', 'Modelo LLM a usar', 'claude-sonnet-4-5')
        .option('-v, --verbose', 'Saída detalhada com raciocínio do LLM')
        .option('-q, --quiet', 'Apenas erros e resumo final')
        .option('-y, --auto', 'Confirmar todas as ações automaticamente')
        .option('--no-git', 'Desabilitar integração git')
        .action((prompt: string | undefined) => {
            if (prompt) {
                // eslint-disable-next-line no-console
                console.log(`\n🐺 Coiote v${pkg.version}`);
                // eslint-disable-next-line no-console
                console.log(`📋 Tarefa recebida: "${prompt}"`);
                // eslint-disable-next-line no-console
                console.log(`⏳ Agente ainda não implementado — em desenvolvimento (Fase 1, Semana 2+)\n`);
            }
        });

    return program;
}

export async function run(): Promise<void> {
    const program = createProgram();
    await program.parseAsync(process.argv);
}

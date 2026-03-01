/**
 * 🐺 Coiote — Assistente de Desenvolvimento Guiado por IA
 *
 * Entrypoint principal.
 * Verifica a versão do Node.js antes de carregar qualquer módulo pesado.
 */

const MIN_NODE_VERSION = 20;

function checkNodeVersion(): void {
    const currentVersion = parseInt(process.versions.node.split('.')[0] ?? '0', 10);

    if (currentVersion < MIN_NODE_VERSION) {
        // eslint-disable-next-line no-console
        console.error(
            `\n❌ Coiote requer Node.js ${String(MIN_NODE_VERSION)}+, mas você está usando Node.js ${process.versions.node}.\n` +
            `   Atualize em: https://nodejs.org\n`
        );
        process.exit(1);
    }
}

async function main(): Promise<void> {
    checkNodeVersion();

    // Lazy import — carrega CLI apenas após validação do Node.js
    const { run } = await import('./cli.js');
    await run();
}

main().catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error('\n❌ Erro fatal ao iniciar o Coiote:\n', error);
    process.exit(1);
});

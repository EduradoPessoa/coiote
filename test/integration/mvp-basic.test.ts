import { describe, it, expect, vi } from 'vitest';
import { CoioteAgent } from '../../src/agent/agent.js';
import { Reporter } from '../../src/ui/reporter.js';
import { PermissionManager } from '../../src/permissions/permission-manager.js';
import { ToolRegistry } from '../../src/tools/registry.js';
import { writeFileTool, readFileTool } from '../../src/tools/filesystem/index.js';
import type { LLMProvider, ChatParams, StreamEvent } from '../../src/providers/types.js';

vi.mock('../../src/persistence/db.js', () => ({
    DbClient: {
        getInstance: () => ({
            prepare: () => ({ run: () => ({ lastInsertRowid: 1 }) }),
            transaction: (cb: any) => cb,
            exec: () => { }
        })
    }
}));

class MockProvider implements LLMProvider {
    name = 'MockProvider';
    supportsToolUse = true;

    constructor(private scenario: 'success' | 'error') { }

    async *stream(params: ChatParams): AsyncIterable<StreamEvent> {
        // Simulando raciocínio
        yield { type: 'text', text: 'Eu sigo a sua indicação, criarei um README aqui' };

        // Injetando pseudo tools dependendo do cenário
        const isPlanner = params.tools?.some(t => t.name === 'submit_plan');

        if (this.scenario === 'success') {
            if (isPlanner) {
                yield {
                    type: 'tool_use',
                    toolCall: {
                        id: 'call_1',
                        name: 'submit_plan',
                        input: { steps: ['Criar mock README.md'], filesToModify: ['README.md'] }
                    }
                };
            } else {
                yield {
                    type: 'tool_use',
                    toolCall: {
                        id: 'write_readme',
                        name: 'write_file',
                        input: { path: 'README.md', content: '# Fake Test\n' }
                    }
                };
            }
        } else {
            if (isPlanner) {
                yield {
                    type: 'tool_use',
                    toolCall: {
                        id: 'call_plan',
                        name: 'submit_plan',
                        input: { steps: ['Tentar causar erro lendo path secreto'], filesToModify: [] }
                    }
                };
            } else {
                yield {
                    type: 'tool_use',
                    toolCall: { id: 'fail_it', name: 'read_file', input: { path: '.git/config' } }
                };
            }
        }
    }
}


describe('Integração MVP do Loop Agêntico', () => {

    it('cenário: criar arquivo README → deve exibir plano, confirmar e exibir resumo', async () => {
        const mockProvider = new MockProvider('success');
        const reporter = new Reporter();
        const pManager = new PermissionManager(reporter);

        // Spy hooks UI
        const planSpy = vi.fn();
        const toolReqSpy = vi.fn();
        const doneSpy = vi.fn();

        reporter.on('plan', planSpy);
        reporter.on('tool:call', toolReqSpy);
        reporter.on('done', doneSpy);

        // Inject simulação de Inquirer para não travar CWD
        vi.spyOn(pManager, 'request').mockResolvedValue(true);

        const tReg = new ToolRegistry();
        tReg.register(writeFileTool);
        tReg.register(readFileTool);

        const agent = new CoioteAgent({
            provider: mockProvider,
            projectRoot: 'E:/mock/root',
            reporter: reporter,
            permissions: pManager,
            tools: tReg,
            model: 'claude-3-5-sonnet-latest'
        });

        await agent.run('Criar o arquivo README com titulo.');

        expect(planSpy).toHaveBeenCalledOnce();
        expect(toolReqSpy).toHaveBeenCalled();
        // tool chamado
        expect(toolReqSpy.mock.calls[0][0].tool).toBe('write_file');
        expect(toolReqSpy.mock.calls[0][0].args.path).toBe('README.md');
        expect(doneSpy).toHaveBeenCalled();
    });
});

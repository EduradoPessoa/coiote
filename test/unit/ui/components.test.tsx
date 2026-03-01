import React from 'react';
import { render } from 'ink-testing-library';
import { describe, it, expect } from 'vitest';

import { PlanDisplay } from '../../../src/ui/components/PlanDisplay.js';
import { StepProgress } from '../../../src/ui/components/StepProgress.js';
import { ErrorDisplay } from '../../../src/ui/components/ErrorDisplay.js';
import { DoneDisplay } from '../../../src/ui/components/DoneDisplay.js';
import { CoioteError, ErrorCode } from '../../../src/errors.js';

describe('UI Components', () => {

    it('renderiza o PlanDisplay corretamente', () => {
        const plan = {
            steps: ['Ler repo', 'Instalar prop'],
            filesToModify: ['src/app.ts'],
        };

        const { lastFrame } = render(<PlanDisplay plan={plan} />);
        const output = lastFrame() || '';

        expect(output).toContain('PLANO DE EXECUÇÃO');
        expect(output).toContain('1. Ler repo');
        expect(output).toContain('2. Instalar prop');
        expect(output).toContain('src/app.ts');
    });

    it('renderiza o StepProgress indicando progresso', () => {
        const step = { title: 'Instalando NPM' };
        const { lastFrame } = render(<StepProgress step={step} current={3} total={7} />);
        const output = lastFrame() || '';

        expect(output).toContain('EXECUTANDO PASSO 3/7');
        expect(output).toContain('Instalando NPM');
    });

    it('renderiza o ErrorDisplay para erros customizados', () => {
        const err = new CoioteError('Sem internet', ErrorCode.PROVIDER_API_ERROR, {
            attempted: ['tentou bater no /v1/messages'],
            rawError: 'ECONNRESET',
        });

        const { lastFrame } = render(<ErrorDisplay error={err} />);
        const output = lastFrame() || '';

        expect(output).toContain('ERRO NA EXECUÇÃO');
        expect(output).toContain('Sem internet');
        expect(output).toContain('tentou bater no /v1/messages');
        expect(output).toContain('ECONNRESET');
    });

    it('renderiza o DoneDisplay apresentando métricas', () => {
        const summary = {
            filesModified: ['index.ts', 'cli.ts'],
            testResults: '2 passed',
            duration: 15400,
            tokensUsed: 12000,
        };

        const { lastFrame } = render(<DoneDisplay summary={summary} />);
        const output = lastFrame() || '';

        expect(output).toContain('TAREFA CONCLUÍDA');
        expect(output).toContain('index.ts');
        expect(output).toContain('cli.ts');
        expect(output).toContain('15.4 segundos');
        expect(output).toContain('12000');
    });

});

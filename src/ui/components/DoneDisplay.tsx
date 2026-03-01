import React from 'react';
import { Box, Text } from 'ink';
import type { ExecutionSummary } from '../reporter.js';

export interface DoneDisplayProps {
    summary: ExecutionSummary;
}

export const DoneDisplay: React.FC<DoneDisplayProps> = ({ summary }) => {
    return (
        <Box flexDirection="column" marginY={1}>
            <Text color="greenBright" bold>
                🎉 TAREFA CONCLUÍDA
            </Text>
            <Text color="gray">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>

            <Box flexDirection="column" marginY={1}>
                <Text bold> O que foi modificado:</Text>
                {summary.filesModified.length > 0 ? summary.filesModified.map((file, i) => (
                    <Text key={i} color="green">  ✅ {file}</Text>
                )) : <Text dimColor> Nenhuma modificação feita.</Text>}
            </Box>

            {(summary.testResults || summary.tokensUsed || summary.duration) && (
                <Box flexDirection="column" marginBottom={1}>
                    {summary.testResults && <Text>  Resultados dos testes: {summary.testResults}</Text>}
                    {summary.duration && <Text>  Tempo total: {(summary.duration / 1000).toFixed(1)} segundos</Text>}
                    {summary.tokensUsed && <Text>  Tokens utilizados: ~{summary.tokensUsed}</Text>}
                </Box>
            )}

            <Text color="gray">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>
        </Box>
    );
};

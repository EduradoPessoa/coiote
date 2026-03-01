import React from 'react';
import { Box, Text } from 'ink';
import type { CoioteError } from '../../errors.js';

export interface ErrorDisplayProps {
    error: CoioteError | Error;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
    const isCoioteError = 'code' in error;
    const attempted = isCoioteError && (error as any).context?.attempted as string[];

    return (
        <Box flexDirection="column" marginY={1}>
            <Text color="red" bold>
                ❌ ERRO NA EXECUÇÃO
            </Text>
            <Text color="gray">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>

            <Box marginY={1} flexDirection="column">
                <Text bold> O que falhou: <Text color="redBright">{error.message}</Text></Text>
                {isCoioteError && (
                    <Text color="gray"> Código do erro: {(error as any).code}</Text>
                )}
            </Box>

            {attempted && attempted.length > 0 && (
                <Box flexDirection="column" marginBottom={1}>
                    <Text bold> O que tentei:</Text>
                    {attempted.map((att, i) => (
                        <Text key={i} color="white">  • {att}</Text>
                    ))}
                </Box>
            )}

            {isCoioteError && (error as any).context?.rawError && (
                <Box flexDirection="column" marginBottom={1}>
                    <Text bold> Saída de erro crua:</Text>
                    <Box borderStyle="single" paddingX={1}>
                        <Text dimColor>{String((error as any).context.rawError)}</Text>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

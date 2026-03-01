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
                🎉 {summary.message.toUpperCase()}
            </Text>
            <Text color="gray">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>

            {summary.metrics && summary.metrics.length > 0 && (
                <Box flexDirection="column" marginY={1}>
                    {summary.metrics.map((m, i) => (
                        <Text key={i}>
                            <Text color="cyan" bold>{m.label}:</Text> <Text>{m.value}</Text>
                        </Text>
                    ))}
                </Box>
            )}

            <Text color="gray">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>
        </Box>
    );
};

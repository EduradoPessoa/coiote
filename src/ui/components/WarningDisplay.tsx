import React from 'react';
import { Box, Text } from 'ink';

export interface WarningDisplayProps {
    message: string;
    context?: string;
}

export const WarningDisplay: React.FC<WarningDisplayProps> = ({ message, context }) => {
    return (
        <Box flexDirection="column" marginY={1}>
            <Text color="yellow" bold>
                ⚠️ ATENÇÃO
            </Text>
            <Text color="gray">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>

            <Box flexDirection="column" marginY={1}>
                <Text color="yellow">{message}</Text>
                {context && <Text dimColor>{context}</Text>}
            </Box>
        </Box>
    );
};

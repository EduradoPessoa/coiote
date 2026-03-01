import React from 'react';
import { Box, Text } from 'ink';

export interface DiffPreviewProps {
    diff: string;
}

export const DiffPreview: React.FC<DiffPreviewProps> = ({ diff }) => {
    return (
        <Box flexDirection="column" marginY={1}>
            <Text bold>PRÉVIA DO ARQUIVO:</Text>
            <Box borderStyle="single" flexDirection="column" paddingX={1}>
                {diff.split('\n').map((line, i) => {
                    let color = 'white';
                    if (line.startsWith('+')) color = 'green';
                    if (line.startsWith('-')) color = 'red';
                    return (
                        <Text key={i} color={color}>
                            {line}
                        </Text>
                    );
                })}
            </Box>
        </Box>
    );
};

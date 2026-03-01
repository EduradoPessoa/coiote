import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import cliSpinners from 'cli-spinners';
import type { Step } from '../reporter.js';

export interface StepProgressProps {
    step: Step;
    current: number;
    total: number;
}

export const StepProgress: React.FC<StepProgressProps> = ({ step, current, total }) => {
    const [frame, setFrame] = useState(0);
    const spinner = cliSpinners.dots;

    useEffect(() => {
        const timer = setInterval(() => {
            setFrame((prev) => (prev + 1) % spinner.frames.length);
        }, spinner.interval);
        return () => clearInterval(timer);
    }, [spinner]);

    return (
        <Box flexDirection="column" marginY={1}>
            <Text color="cyan" bold>
                ⚡ EXECUTANDO PASSO {current}/{total}
            </Text>
            <Text color="gray">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>
            <Box marginTop={1}>
                <Text color="yellow">{spinner.frames[frame]}</Text>
                <Text> {step.title}</Text>
            </Box>
        </Box>
    );
};

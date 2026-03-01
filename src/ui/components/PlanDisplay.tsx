import React from 'react';
import { Box, Text } from 'ink';
import type { ExecutionPlan } from '../reporter.js';

export interface PlanDisplayProps {
    plan: ExecutionPlan;
}

export const PlanDisplay: React.FC<PlanDisplayProps> = ({ plan }) => {
    return (
        <Box flexDirection="column" marginY={1}>
            <Text color="blue" bold>
                📋 PLANO DE EXECUÇÃO
            </Text>
            <Text color="gray">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>

            <Box flexDirection="column" marginY={1}>
                <Text bold> Vou executar os seguintes passos:</Text>
                {plan.steps.map((step, index) => (
                    <Text key={index} color="white">
                        {'  '}{index + 1}. {step}
                    </Text>
                ))}
            </Box>

            {plan.filesToModify && plan.filesToModify.length > 0 && (
                <Box flexDirection="column" marginBottom={1}>
                    <Text bold> Arquivos que podem ser modificados:</Text>
                    {plan.filesToModify.map((file, index) => (
                        <Text key={index} color="white">
                            {'  '}• {file}
                        </Text>
                    ))}
                </Box>
            )}
        </Box>
    );
};

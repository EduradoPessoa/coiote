import React from 'react';
import { Box, Text } from 'ink';

export interface ToolCallDisplayProps {
    tool: string;
    args: Record<string, unknown>;
}

export const ToolCallDisplay: React.FC<ToolCallDisplayProps> = ({ tool, args }) => {

    // Custom display formatter based on the tool
    const formatToolCall = () => {
        switch (tool) {
            case 'read_file':
                return <Text>Lendo arquivo: {String(args.path)}</Text>;
            case 'write_file':
                return <Text>Criando/editando arquivo: {String(args.path)}</Text>;
            case 'run_command':
                return <Text>Executando shell: {String(args.command)}</Text>;
            case 'list_files':
                return <Text>Listando arquivos (pattern: {String(args.pattern)})</Text>;
            default:
                return <Text>Processando ferramenta '{tool}'</Text>;
        }
    };

    return (
        <Box>
            <Text color="yellow">🔧 </Text>
            {formatToolCall()}
        </Box>
    );
};

import type { LLMProvider } from '../providers/types.js';
import type { Reporter, ExecutionPlan } from '../ui/reporter.js';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages.mjs';
import { SYSTEM_PROMPT } from './system-prompt.js';

const PLANNER_PROMPT = `
Baseando-se na nova requisição do usuário, você agora deve agir como o MÓDULO PLANEJADOR (Planner).
Seu único papel é retornar um JSON descrevendo a intenção do que será feito, sem executar nenhuma ferramenta.

Voce DEVE retornar um \`tool_use\` com a ferramenta \`submit_plan\`. Responda chamando esta tool.
A Tool passará o atributo \`steps\` (array de strings curtas descrevendo cada passo lógico a ser executado)
e o atributo \`filesToModify\` (array opcional das partes de caminhos e arquivos dedutíveis previstos ou afetados).
`;

export class AgentPlanner {
    constructor(private provider: LLMProvider, private reporter: Reporter) { }

    async generate(prompt: string, projectContext: string): Promise<ExecutionPlan | null> {
        const messages: MessageParam[] = [
            {
                role: 'user',
                content: `<project_context>\n${projectContext}\n</project_context>\n\nRequisição: ${prompt}`
            }
        ];

        try {
            this.reporter.info('⏳ Gerando plano inicial de execução...');

            const responseStream = await this.provider.stream({
                messages,
                system: `${SYSTEM_PROMPT}\n\n${PLANNER_PROMPT}`,
                tools: [{
                    name: 'submit_plan',
                    description: 'Envia o plano de execução extraído do requerimento final.',
                    input_schema: {
                        type: 'object',
                        properties: {
                            steps: { type: 'array', items: { type: 'string' } },
                            filesToModify: { type: 'array', items: { type: 'string' } },
                        },
                        required: ['steps']
                    },
                } as any] // cast Anthropic Tool
            });

            let planData: ExecutionPlan | null = null;
            for await (const chunk of responseStream) {
                if (chunk.type === 'tool_use' && chunk.toolCall?.name === 'submit_plan') {
                    planData = {
                        steps: (chunk.toolCall.input as any).steps,
                        filesToModify: (chunk.toolCall.input as any).filesToModify || [],
                    };
                }
            }

            if (planData) {
                return planData;
            }
            return null;
        } catch (e: any) {
            this.reporter.error(e);
            return null;
        }
    }
}

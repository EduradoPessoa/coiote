/**
 * Coiote - MCP Client
 *
 * Implementa cliente para Model Context Protocol (MCP) servers.
 * Permite estender as ferramentas do Coiote com ferramentas externas.
 *
 * Referencia: coiote-orchestrator.md Secao 5 (Semanas 13-14)
 */

import { EventEmitter } from 'events';

export interface MCPServerConfig {
  name: string;
  url: string;
  enabled: boolean;
  tools?: string[];
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPMessage {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id?: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export class MCPClient extends EventEmitter {
  private config: MCPServerConfig;
  private connection: EventEmitter | null = null;

  constructor(config: MCPServerConfig) {
    super();
    this.config = config;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Simple HTTP connection for MCP
        // In production, this would use the MCP protocol proper
        this.connection = new EventEmitter();
        this.emit('connected');
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  async disconnect(): Promise<void> {
    this.connection = null;
    this.emit('disconnected');
  }

  async listTools(): Promise<MCPTool[]> {
    const message: MCPMessage = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
    };

    const response = await this.sendMessage(message);

    if (response.error) {
      throw new Error(`MCP Error: ${response.error.message}`);
    }

    return (response.result as { tools: MCPTool[] })?.tools || [];
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    const message: MCPMessage = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name,
        arguments: args,
      },
    };

    const response = await this.sendMessage(message);

    if (response.error) {
      throw new Error(`MCP Error: ${response.error.message}`);
    }

    return response.result;
  }

  private async sendMessage(message: MCPMessage): Promise<MCPResponse> {
    // Placeholder for actual MCP communication
    // In production, this would use stdio or HTTP based on server config
    const id = message.id ?? 0;
    return {
      jsonrpc: '2.0',
      id: id as string | number,
      result: {},
    };
  }

  isConnected(): boolean {
    return this.connection !== null;
  }
}

export class MCPManager {
  private servers: Map<string, MCPClient> = new Map();
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || '.coiote-mcp.json';
  }

  async addServer(config: MCPServerConfig): Promise<void> {
    const client = new MCPClient(config);
    await client.connect();
    this.servers.set(config.name, client);
  }

  removeServer(name: string): void {
    const client = this.servers.get(name);
    if (client) {
      client.disconnect();
      this.servers.delete(name);
    }
  }

  getServer(name: string): MCPClient | undefined {
    return this.servers.get(name);
  }

  listServers(): string[] {
    return Array.from(this.servers.keys());
  }

  async getAllTools(): Promise<Map<string, MCPTool[]>> {
    const toolsMap = new Map<string, MCPTool[]>();

    for (const [name, client] of this.servers) {
      try {
        const tools = await client.listTools();
        toolsMap.set(name, tools);
      } catch (e) {
        console.warn(`Failed to get tools from MCP server ${name}:`, e);
      }
    }

    return toolsMap;
  }
}

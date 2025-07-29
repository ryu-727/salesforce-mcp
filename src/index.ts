#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { SalesforceToolingClient } from './client/tooling-client.js';
import { SalesforceRestClient } from './client/rest-client.js';
import { SalesforceConfig } from './types/index.js';
import { createApexClassTools } from './tools/apex-class-tools.js';
import { createApexTriggerTools } from './tools/apex-trigger-tools.js';
import { createVisualforceTools } from './tools/visualforce-tools.js';
import { createQueryTools } from './tools/query-tools.js';
import { createCodeCoverageTools } from './tools/code-coverage-tools.js';
import { createSymbolTableTools } from './tools/symbol-table-tools.js';
import { createDebugTools } from './tools/debug-tools.js';
import { createDeploymentTools } from './tools/deployment-tools.js';
import { createSecurityTools } from './tools/security-tools.js';
import { createPerformanceTools } from './tools/performance-tools.js';
import { createOrgManagementTools } from './tools/org-management-tools.js';
import { createRestApiTools } from './tools/rest-api-tools.js';

const DEFAULT_CONFIG: SalesforceConfig = {
  instanceUrl: process.env.SF_INSTANCE_URL || 'https://login.salesforce.com',
  clientId: process.env.SF_CLIENT_ID || '',
  clientSecret: process.env.SF_CLIENT_SECRET,
  username: process.env.SF_USERNAME,
  password: process.env.SF_PASSWORD,
  securityToken: process.env.SF_SECURITY_TOKEN,
  privateKey: process.env.SF_PRIVATE_KEY,
  subject: process.env.SF_SUBJECT,
  apiVersion: process.env.SF_API_VERSION || '59.0'
};

class SalesforceMCPServer {
  private server: Server;
  private toolingClient: SalesforceToolingClient;
  private restClient: SalesforceRestClient;
  private tools: any[] = [];

  constructor() {
    this.server = new Server(
      {
        name: 'salesforce-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.toolingClient = new SalesforceToolingClient(DEFAULT_CONFIG);
    this.restClient = new SalesforceRestClient(DEFAULT_CONFIG);
    this.registerAllTools();
    this.setupHandlers();
  }

  private registerAllTools(): void {
    this.tools = [
      ...createApexClassTools(this.toolingClient),
      ...createApexTriggerTools(this.toolingClient),
      ...createVisualforceTools(this.toolingClient),
      ...createQueryTools(this.toolingClient),
      ...createCodeCoverageTools(this.toolingClient),
      ...createSymbolTableTools(this.toolingClient),
      ...createDebugTools(this.toolingClient),
      ...createDeploymentTools(this.toolingClient),
      ...createSecurityTools(this.toolingClient),
      ...createPerformanceTools(this.toolingClient),
      ...createOrgManagementTools(this.toolingClient),
      ...createRestApiTools(this.restClient),
    ];
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      const tool = this.tools.find(t => t.name === name);
      if (!tool) {
        return {
          content: [
            {
              type: 'text',
              text: `Tool ${name} not found`,
            },
          ],
          isError: true,
        };
      }

      try {
        return await tool.handler(args || {});
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: `Error executing tool ${name}: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Salesforce MCP Server running on stdio');
  }
}

async function main(): Promise<void> {
  try {
    const server = new SalesforceMCPServer();
    await server.run();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}
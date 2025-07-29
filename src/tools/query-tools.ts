import { z } from 'zod';
import { SalesforceToolingClient } from '../client/tooling-client.js';

export function createQueryTools(client: SalesforceToolingClient) {
  return [
    {
      name: 'execute_tooling_query',
      description: 'Execute SOQL queries against Tooling API',
      inputSchema: { type: 'object', properties: { soql: { type: 'string', minLength: 1 }, limit: { type: 'number', default: 100, maximum: 2000 } }, required: ['soql'] },
      handler: async (args: any) => {
        const schema = z.object({ soql: z.string().min(1), limit: z.number().max(2000).default(100) });
        try {
          const parsedArgs = schema.parse(args);
          const result = await client.query(parsedArgs.soql);
          return { content: [{ type: 'text', text: `Query Results (${result.totalSize} total):\n\n${JSON.stringify(result.records.slice(0, parsedArgs.limit), null, 2)}` }] };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error executing query: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
        }
      }
    },
    {
      name: 'describe_tooling_object',
      description: 'Get schema information for Tooling API objects',
      inputSchema: { type: 'object', properties: { sobjectType: { type: 'string', minLength: 1 } }, required: ['sobjectType'] },
      handler: async (args: any) => {
        const schema = z.object({ sobjectType: z.string().min(1) });
        try {
          const parsedArgs = schema.parse(args);
          const result = await client.describe(parsedArgs.sobjectType);
          return { content: [{ type: 'text', text: `${result.name} Object:\nLabel: ${result.label}\nCreatable: ${result.createable}\nFields: ${result.fields?.length || 0}` }] };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error describing object: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
        }
      }
    }
  ];
}
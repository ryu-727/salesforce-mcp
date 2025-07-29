import { z } from 'zod';
import { SalesforceToolingClient } from '../client/tooling-client.js';

export function createPerformanceTools(client: SalesforceToolingClient) {
  return [
    {
      name: 'analyze_soql_performance',
      description: 'Analyze SOQL query performance',
      inputSchema: { type: 'object', properties: { soql: { type: 'string', minLength: 1 } }, required: ['soql'] },
      handler: async (args: any) => {
        const schema = z.object({ soql: z.string().min(1) });
        try {
          const parsedArgs = schema.parse(args);
          const start = Date.now();
          const result = await client.query(parsedArgs.soql);
          const duration = Date.now() - start;
          return {
            content: [{
              type: 'text',
              text: `SOQL Performance:\nExecution Time: ${duration}ms\nRecords: ${result.records.length}\nTotal Size: ${result.totalSize}`
            }]
          };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error analyzing performance: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
        }
      }
    }
  ];
}
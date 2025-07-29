import { z } from 'zod';
import { SalesforceToolingClient } from '../client/tooling-client.js';

export function createDebugTools(client: SalesforceToolingClient) {
  return [
    {
      name: 'get_debug_logs',
      description: 'Get recent debug logs',
      inputSchema: { type: 'object', properties: { limit: { type: 'number', default: 10, maximum: 100 } } },
      handler: async (args: any) => {
        const schema = z.object({ limit: z.number().max(100).default(10) });
        try {
          const parsedArgs = schema.parse(args);
          const logs = await client.getDebugLogs(parsedArgs.limit);
          return {
            content: [{
              type: 'text',
              text: `Recent Debug Logs (${logs.length}):\n\n${logs.map(log => `• ${log.Id} - ${log.Operation} (${log.DurationMilliseconds}ms)`).join('\n')}`
            }]
          };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error getting debug logs: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
        }
      }
    }
  ];
}
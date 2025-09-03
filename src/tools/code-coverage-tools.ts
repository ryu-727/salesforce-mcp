import { z } from 'zod';
import { SalesforceToolingClient } from '../client/tooling-client.js';

export function createCodeCoverageTools(client: SalesforceToolingClient) {
  return [
    {
      name: 'get_code_coverage',
      description: 'Get code coverage information for Apex classes and triggers',
      inputSchema: { type: 'object', properties: { apexClassOrTriggerId: { type: 'string' }, minCoverage: { type: 'number', minimum: 0, maximum: 100 } } },
      handler: async (args: any) => {
        const schema = z.object({ apexClassOrTriggerId: z.string().optional(), minCoverage: z.number().min(0).max(100).optional() });
        try {
          const parsedArgs = schema.parse(args);
          const coverage = await client.getCodeCoverage(parsedArgs.apexClassOrTriggerId);
          const filtered = parsedArgs.minCoverage !== undefined ? coverage.filter(c => (c.NumLinesCovered / (c.NumLinesCovered + c.NumLinesUncovered)) * 100 >= parsedArgs.minCoverage!) : coverage;
          return {
            content: [{
              type: 'text',
              text: `Code Coverage (${filtered.length} items):\n\n${filtered.map(c => {
                const percentage = ((c.NumLinesCovered / (c.NumLinesCovered + c.NumLinesUncovered)) * 100).toFixed(1);
                return `• ${c.ApexClassOrTrigger.Name}: ${percentage}% (${c.NumLinesCovered}/${c.NumLinesCovered + c.NumLinesUncovered})`;
              }).join('\n')}`
            }]
          };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error getting coverage: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
        }
      }
    },
    {
      name: 'run_tests',
      description: 'Execute Apex tests',
      inputSchema: { type: 'object', properties: { classIds: { type: 'array', items: { type: 'string' } } } },
      handler: async (args: any) => {
        const schema = z.object({ classIds: z.array(z.string()).optional() });
        try {
          const parsedArgs = schema.parse(args);
          const result = await client.runTests(parsedArgs.classIds);
          return { content: [{ type: 'text', text: `Test execution started. Job ID: ${result.id}` }] };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error running tests: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
        }
      }
    }
  ];
}
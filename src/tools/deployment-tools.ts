import { z } from 'zod';
import { SalesforceToolingClient } from '../client/tooling-client.js';

export function createDeploymentTools(client: SalesforceToolingClient) {
  return [
    {
      name: 'validate_syntax',
      description: 'Validate Apex class syntax',
      inputSchema: { type: 'object', properties: { apexClassId: { type: 'string', minLength: 15 } }, required: ['apexClassId'] },
      handler: async (args: any) => {
        const schema = z.object({ apexClassId: z.string().min(15) });
        try {
          const parsedArgs = schema.parse(args);
          const apexClass = await client.getApexClass(parsedArgs.apexClassId);
          return {
            content: [{
              type: 'text',
              text: `Syntax Validation for ${apexClass.Name}:\nStatus: ${apexClass.Status}\nValid: ${apexClass.IsValid}`
            }]
          };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error validating syntax: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
        }
      }
    }
  ];
}
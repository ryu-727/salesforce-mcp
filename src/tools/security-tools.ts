import { z } from 'zod';
import { SalesforceToolingClient } from '../client/tooling-client.js';

export function createSecurityTools(client: SalesforceToolingClient) {
  return [
    {
      name: 'check_apex_sharing',
      description: 'Check Apex class sharing declarations',
      inputSchema: { type: 'object', properties: { apexClassId: { type: 'string', minLength: 15 } }, required: ['apexClassId'] },
      handler: async (args: any) => {
        const schema = z.object({ apexClassId: z.string().min(15) });
        try {
          const parsedArgs = schema.parse(args);
          const apexClass = await client.getApexClass(parsedArgs.apexClassId);
          const hasSharing = apexClass.Body.includes('with sharing') || apexClass.Body.includes('without sharing');
          const sharingType = apexClass.Body.includes('with sharing') ? 'with sharing' : 
                             apexClass.Body.includes('without sharing') ? 'without sharing' : 'inherited sharing';
          return {
            content: [{
              type: 'text',
              text: `Sharing Analysis for ${apexClass.Name}:\nSharing Type: ${sharingType}\nDeclaration: ${hasSharing ? 'Present' : 'Missing'}`
            }]
          };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error checking sharing: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
        }
      }
    }
  ];
}
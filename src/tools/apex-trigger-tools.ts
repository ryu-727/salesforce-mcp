import { z } from 'zod';
import { SalesforceToolingClient } from '../client/tooling-client.js';

export function createApexTriggerTools(client: SalesforceToolingClient) {
  return [
    {
      name: 'list_apex_triggers',
      description: 'List Apex triggers in the organization with optional name filtering',
      inputSchema: { type: 'object', properties: { nameFilter: { type: 'string' }, limit: { type: 'number', default: 50, maximum: 200 } } },
      handler: async (args: any) => {
        const schema = z.object({ nameFilter: z.string().optional(), limit: z.number().max(200).default(50) });
        try {
          const parsedArgs = schema.parse(args);
          const triggers = await client.getApexTriggers(parsedArgs.nameFilter);
          const limitedTriggers = triggers.slice(0, parsedArgs.limit);
          return {
            content: [{
              type: 'text',
              text: `Found ${triggers.length} Apex triggers:\n\n${limitedTriggers.map(t => `• ${t.Name} (${t.Id})\n  Object: ${t.TableEnumOrId}\n  Status: ${t.Status}, Valid: ${t.IsValid}`).join('\n\n')}`
            }]
          };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error listing triggers: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
        }
      }
    },
    {
      name: 'get_apex_trigger',
      description: 'Get detailed information about a specific Apex trigger',
      inputSchema: { type: 'object', properties: { id: { type: 'string', minLength: 15 } }, required: ['id'] },
      handler: async (args: any) => {
        const schema = z.object({ id: z.string().min(15) });
        try {
          const parsedArgs = schema.parse(args);
          const trigger = await client.getApexTrigger(parsedArgs.id);
          return {
            content: [{
              type: 'text',
              text: `Trigger: ${trigger.Name}\nObject: ${trigger.TableEnumOrId}\nStatus: ${trigger.Status}\n\nBody:\n\`\`\`apex\n${trigger.Body}\n\`\`\``
            }]
          };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error getting trigger: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
        }
      }
    }
  ];
}
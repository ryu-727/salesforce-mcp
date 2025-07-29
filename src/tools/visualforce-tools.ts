import { z } from 'zod';
import { SalesforceToolingClient } from '../client/tooling-client.js';

export function createVisualforceTools(client: SalesforceToolingClient) {
  return [
    {
      name: 'list_apex_pages',
      description: 'List Visualforce pages',
      inputSchema: { type: 'object', properties: { nameFilter: { type: 'string' }, limit: { type: 'number', default: 50, maximum: 200 } } },
      handler: async (args: any) => {
        const schema = z.object({ nameFilter: z.string().optional(), limit: z.number().max(200).default(50) });
        try {
          const parsedArgs = schema.parse(args);
          const pages = await client.getApexPages(parsedArgs.nameFilter);
          return {
            content: [{
              type: 'text',
              text: `Found ${pages.length} Visualforce pages:\n\n${pages.slice(0, parsedArgs.limit).map(p => `• ${p.Name} (${p.Id})\n  Label: ${p.MasterLabel}`).join('\n\n')}`
            }]
          };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error listing pages: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
        }
      }
    },
    {
      name: 'get_apex_page',
      description: 'Get detailed information about a Visualforce page',
      inputSchema: { type: 'object', properties: { id: { type: 'string', minLength: 15 } }, required: ['id'] },
      handler: async (args: any) => {
        const schema = z.object({ id: z.string().min(15) });
        try {
          const parsedArgs = schema.parse(args);
          const page = await client.getApexPage(parsedArgs.id);
          return {
            content: [{
              type: 'text',
              text: `Page: ${page.Name}\nLabel: ${page.MasterLabel}\nController: ${page.ControllerType}\n\nMarkup:\n\`\`\`html\n${page.Markup}\n\`\`\``
            }]
          };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error getting page: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
        }
      }
    }
  ];
}
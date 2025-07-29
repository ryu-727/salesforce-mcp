import { z } from 'zod';
import { SalesforceToolingClient } from '../client/tooling-client.js';

export function createApexClassTools(client: SalesforceToolingClient) {
  return [
    {
      name: 'list_apex_classes',
      description: 'List Apex classes in the organization with optional name filtering',
      inputSchema: {
        type: 'object',
        properties: {
          nameFilter: { type: 'string', description: 'Optional filter to search for classes by name' },
          limit: { type: 'number', description: 'Maximum number of results to return (default: 50, max: 200)', default: 50, maximum: 200 },
        },
      },
      handler: async (args: any) => {
        const schema = z.object({ nameFilter: z.string().optional(), limit: z.number().max(200).default(50) });
        try {
          const parsedArgs = schema.parse(args);
          const classes = await client.getApexClasses(parsedArgs.nameFilter);
          const limitedClasses = classes.slice(0, parsedArgs.limit);
          return {
            content: [{
              type: 'text',
              text: `Found ${classes.length} Apex classes${parsedArgs.nameFilter ? ` matching '${parsedArgs.nameFilter}'` : ''}:\n\n` +
                    limitedClasses.map(cls => `• ${cls.Name} (${cls.Id})\n  Status: ${cls.Status}, Valid: ${cls.IsValid}\n  Modified: ${new Date(cls.LastModifiedDate).toLocaleString()}`).join('\n\n'),
            }],
          };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error listing Apex classes: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
        }
      },
    },
    {
      name: 'get_apex_class',
      description: 'Get detailed information about a specific Apex class including its source code',
      inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'The 15 or 18 character ID of the Apex class', minLength: 15 } }, required: ['id'] },
      handler: async (args: any) => {
        const schema = z.object({ id: z.string().min(15) });
        try {
          const parsedArgs = schema.parse(args);
          const apexClass = await client.getApexClass(parsedArgs.id);
          return {
            content: [{
              type: 'text',
              text: `Apex Class: ${apexClass.Name}\nID: ${apexClass.Id}\nStatus: ${apexClass.Status}\nValid: ${apexClass.IsValid}\nAPI Version: ${apexClass.ApiVersion}\nNamespace: ${apexClass.NamespacePrefix || 'None'}\nLines without comments: ${apexClass.LengthWithoutComments}\nLast Modified: ${new Date(apexClass.LastModifiedDate).toLocaleString()}\n\nBody:\n\`\`\`apex\n${apexClass.Body}\n\`\`\``
            }]
          };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error getting Apex class: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
        }
      },
    },
    {
      name: 'create_apex_class',
      description: 'Create a new Apex class',
      inputSchema: { type: 'object', properties: { name: { type: 'string', minLength: 1, maxLength: 40 }, body: { type: 'string', minLength: 1 } }, required: ['name', 'body'] },
      handler: async (args: any) => {
        const schema = z.object({ name: z.string().min(1).max(40), body: z.string().min(1) });
        try {
          const parsedArgs = schema.parse(args);
          const result = await client.createApexClass(parsedArgs.name, parsedArgs.body);
          if (result.success) {
            return { content: [{ type: 'text', text: `Successfully created Apex class '${parsedArgs.name}' with ID: ${result.id}` }] };
          } else {
            return { content: [{ type: 'text', text: `Failed to create Apex class '${parsedArgs.name}':\n${result.errors.map(e => `• ${e.message}`).join('\n')}` }], isError: true };
          }
        } catch (error) {
          return { content: [{ type: 'text', text: `Error creating Apex class: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
        }
      },
    },
    {
      name: 'update_apex_class',
      description: 'Update the source code of an existing Apex class',
      inputSchema: { type: 'object', properties: { id: { type: 'string', minLength: 15 }, body: { type: 'string', minLength: 1 } }, required: ['id', 'body'] },
      handler: async (args: any) => {
        const schema = z.object({ id: z.string().min(15), body: z.string().min(1) });
        try {
          const parsedArgs = schema.parse(args);
          await client.updateApexClass(parsedArgs.id, parsedArgs.body);
          return { content: [{ type: 'text', text: `Successfully updated Apex class with ID: ${parsedArgs.id}` }] };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error updating Apex class: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
        }
      },
    },
    {
      name: 'delete_apex_class',
      description: 'Delete an Apex class (use with caution)',
      inputSchema: { type: 'object', properties: { id: { type: 'string', minLength: 15 } }, required: ['id'] },
      handler: async (args: any) => {
        const schema = z.object({ id: z.string().min(15) });
        try {
          const parsedArgs = schema.parse(args);
          await client.deleteApexClass(parsedArgs.id);
          return { content: [{ type: 'text', text: `Successfully deleted Apex class with ID: ${parsedArgs.id}` }] };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error deleting Apex class: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
        }
      },
    }
  ];
}
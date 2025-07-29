import { z } from 'zod';
import { SalesforceToolingClient } from '../client/tooling-client.js';

export function createSymbolTableTools(client: SalesforceToolingClient) {
  return [
    {
      name: 'get_symbol_table',
      description: 'Get symbol table for an Apex class',
      inputSchema: { type: 'object', properties: { apexClassId: { type: 'string', minLength: 15 } }, required: ['apexClassId'] },
      handler: async (args: any) => {
        const schema = z.object({ apexClassId: z.string().min(15) });
        try {
          const parsedArgs = schema.parse(args);
          const symbolTable = await client.getSymbolTable(parsedArgs.apexClassId);
          const st = symbolTable.SymbolTable;
          return {
            content: [{
              type: 'text',
              text: `Symbol Table for ${symbolTable.Name}:\n\nMethods: ${st.methods?.length || 0}\nProperties: ${st.properties?.length || 0}\nVariables: ${st.variables?.length || 0}`
            }]
          };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error getting symbol table: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
        }
      }
    }
  ];
}
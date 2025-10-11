import { z } from 'zod';
import { SalesforceToolingClient } from '../client/tooling-client.js';

export function createOrgManagementTools(client: SalesforceToolingClient) {
  return [
    {
      name: 'get_org_info',
      description: 'Get organization information',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => {
        try {
          // OrganizationオブジェクトはSOQL APIを使用する必要があるため、直接REST APIを呼び出し
          const orgInfo = await client.getOrgInfo();
          return {
            content: [{
              type: 'text',
              text: `Organization: ${orgInfo.Name}\nType: ${orgInfo.OrganizationType}\nInstance: ${orgInfo.InstanceName}\nSandbox: ${orgInfo.IsSandbox ? 'Yes' : 'No'}`
            }]
          };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error getting org info: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
        }
      }
    },
    {
      name: 'list_sobjects',
      description: 'List available SObjects',
      inputSchema: { type: 'object', properties: { nameFilter: { type: 'string' }, limit: { type: 'number', default: 50, maximum: 100 } } },
      handler: async (args: any) => {
        const schema = z.object({ nameFilter: z.string().optional(), limit: z.number().max(100).default(50) });
        try {
          const parsedArgs = schema.parse(args);
          let soql = 'SELECT QualifiedApiName, Label, IsCustom FROM EntityDefinition WHERE IsQueryable = true';
          if (parsedArgs.nameFilter) soql += ` AND QualifiedApiName LIKE '%${parsedArgs.nameFilter}%'`;
          soql += ` ORDER BY QualifiedApiName LIMIT ${parsedArgs.limit}`;
          const result = await client.query(soql);
          return {
            content: [{
              type: 'text',
              text: `Available SObjects (${result.records.length}):\n\n${result.records.map((obj: any) => `• ${obj.QualifiedApiName} - ${obj.Label}${obj.IsCustom ? ' (Custom)' : ''}`).join('\n')}`
            }]
          };
        } catch (error) {
          return { content: [{ type: 'text', text: `Error listing SObjects: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
        }
      }
    }
  ];
}
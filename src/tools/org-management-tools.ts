import { SalesforceRestClient } from '../client/rest-client.js';

export function createOrgManagementTools(client: SalesforceRestClient) {
  return [
    {
      name: 'get_org_info',
      description: 'Get organization information',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => {
        try {
          // Use REST API to query Organization object
          const soql = 'SELECT Id, Name, OrganizationType, InstanceName, IsSandbox FROM Organization LIMIT 1';
          const result = await client.query(soql);
          const orgInfo = result.records[0];
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
    }
  ];
}
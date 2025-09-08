import { z } from 'zod';
import { SalesforceRestClient } from '../client/rest-client.js';

export function createRestApiTools(client: SalesforceRestClient) {
  return [
    {
      name: 'get_org_limits',
      description: 'Get organization limits information from Salesforce REST API',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false
      },
      handler: async () => {
        try {
          const result = await client.getLimits();
          
          // Process limits to show usage percentages and warnings
          const processedLimits = Object.entries(result).map(([key, value]: [string, any]) => {
            if (typeof value === 'object' && value.Max !== undefined && value.Remaining !== undefined) {
              const used = value.Max - value.Remaining;
              const usagePercent = ((used / value.Max) * 100).toFixed(1);
              const status = parseFloat(usagePercent) > 80 ? '⚠️' : parseFloat(usagePercent) > 50 ? '⚡' : '✅';
              
              return {
                name: key,
                max: value.Max,
                used: used,
                remaining: value.Remaining,
                usagePercent: `${usagePercent}%`,
                status: status
              };
            }
            return { name: key, value: value };
          });

          // Separate high usage items for summary
          const highUsageItems = processedLimits.filter((item: any) => 
            item.usagePercent && parseFloat(item.usagePercent) > 50
          );

          let summaryText = `Organization Limits Summary:\n\n`;
          
          if (highUsageItems.length > 0) {
            summaryText += `⚠️  High Usage Items:\n`;
            highUsageItems.forEach((item: any) => {
              summaryText += `  ${item.status} ${item.name}: ${item.used}/${item.max} (${item.usagePercent})\n`;
            });
            summaryText += `\n`;
          }

          summaryText += `📊 All Limits:\n\n`;
          processedLimits.forEach((item: any) => {
            if (item.usagePercent) {
              summaryText += `${item.status} ${item.name}: ${item.used}/${item.max} (${item.usagePercent}) - ${item.remaining} remaining\n`;
            } else {
              summaryText += `📋 ${item.name}: ${JSON.stringify(item.value)}\n`;
            }
          });
          
          return {
            content: [{
              type: 'text',
              text: summaryText
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error getting org limits: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true
          };
        }
      }
    },
    {
      name: 'call_rest_api',
      description: 'Make a generic REST API call to Salesforce (supports GET, POST, PATCH, DELETE)',
      inputSchema: {
        type: 'object',
        properties: {
          endpoint: {
            type: 'string',
            description: 'The API endpoint path (e.g., "limits", "sobjects", "query")',
            minLength: 1
          },
          method: {
            type: 'string',
            enum: ['GET', 'POST', 'PATCH', 'DELETE'],
            default: 'GET',
            description: 'HTTP method to use'
          },
          body: {
            type: 'object',
            description: 'Request body for POST/PATCH requests'
          },
          params: {
            type: 'object',
            description: 'Query parameters'
          }
        },
        required: ['endpoint'],
        additionalProperties: false
      },
      handler: async (args: any) => {
        const schema = z.object({
          endpoint: z.string().min(1),
          method: z.enum(['GET', 'POST', 'PATCH', 'DELETE']).default('GET'),
          body: z.record(z.any()).optional(),
          params: z.record(z.any()).optional()
        });
        
        try {
          const parsedArgs = schema.parse(args);
          
          const result = await client.callApi(
            parsedArgs.endpoint,
            parsedArgs.method,
            parsedArgs.body,
            parsedArgs.params
          );
          
          return {
            content: [{
              type: 'text',
              text: `REST API Response (${parsedArgs.method} ${parsedArgs.endpoint}):\n\n${JSON.stringify(result, null, 2)}`
            }]
          };
        } catch (error: any) {
          let errorMessage = 'Unknown error';
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          if (error.response?.data) {
            errorMessage += `\nResponse: ${JSON.stringify(error.response.data, null, 2)}`;
          }
          
          return {
            content: [{
              type: 'text',
              text: `Error calling REST API: ${errorMessage}`
            }],
            isError: true
          };
        }
      }
    },
    {
      name: 'get_sobjects_list',
      description: 'Get list of all available SObjects from Salesforce REST API',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false
      },
      handler: async () => {
        try {
          const result = await client.getSObjects();
          
          const sobjects = result.sobjects?.map((obj: any) => ({
            name: obj.name,
            label: obj.label,
            keyPrefix: obj.keyPrefix,
            custom: obj.custom,
            queryable: obj.queryable,
            createable: obj.createable,
            updateable: obj.updateable,
            deletable: obj.deletable
          })) || [];
          
          return {
            content: [{
              type: 'text',
              text: `Available SObjects (${sobjects.length} total):\n\n${JSON.stringify(sobjects, null, 2)}`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error getting SObjects list: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true
          };
        }
      }
    },
    {
      name: 'describe_sobject',
      description: 'Describe a specific SObject using REST API',
      inputSchema: {
        type: 'object',
        properties: {
          sobjectType: {
            type: 'string',
            description: 'Name of the SObject to describe',
            minLength: 1
          }
        },
        required: ['sobjectType'],
        additionalProperties: false
      },
      handler: async (args: any) => {
        const schema = z.object({
          sobjectType: z.string().min(1)
        });
        
        try {
          const parsedArgs = schema.parse(args);
          
          const describe = await client.describeSObject(parsedArgs.sobjectType);
          const summary = {
            name: describe.name,
            label: describe.label,
            keyPrefix: describe.keyPrefix,
            custom: describe.custom,
            queryable: describe.queryable,
            createable: describe.createable,
            updateable: describe.updateable,
            deletable: describe.deletable,
            fieldsCount: describe.fields?.length || 0,
            recordTypeInfos: describe.recordTypeInfos?.length || 0
          };
          
          return {
            content: [{
              type: 'text',
              text: `SObject Description for ${parsedArgs.sobjectType}:\n\n${JSON.stringify(summary, null, 2)}\n\nFields:\n${describe.fields?.map((f: any) => `- ${f.name} (${f.type}): ${f.label}`).join('\n') || 'No fields found'}`
            }]
          };
        } catch (error: any) {
          let errorMessage = 'Unknown error';
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          if (error.response?.status === 404) {
            errorMessage = `SObject '${args.sobjectType}' not found`;
          }
          
          return {
            content: [{
              type: 'text',
              text: `Error describing SObject: ${errorMessage}`
            }],
            isError: true
          };
        }
      }
    }
  ];
}
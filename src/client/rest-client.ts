import { SalesforceAuth } from '../auth/salesforce-auth.js';
import { SalesforceConfig } from '../types/index.js';

export class SalesforceRestClient {
  private auth: SalesforceAuth;

  constructor(config: SalesforceConfig, sharedAuth?: SalesforceAuth) {
    this.auth = sharedAuth || new SalesforceAuth(config);
  }

  // Generic REST API call
  async callApi(endpoint: string, method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET', body?: any, params?: any): Promise<any> {
    let url = endpoint;

    // Add query parameters to URL if provided
    if (params) {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          searchParams.append(key, params[key].toString());
        }
      });
      if (searchParams.toString()) {
        url += (url.includes('?') ? '&' : '?') + searchParams.toString();
      }
    }

    const options: any = { method };
    if (body && (method === 'POST' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
      options.headers = { 'Content-Type': 'application/json' };
    }

    return await this.auth.restRequest(url, options);
  }

  // Specific REST API methods
  async getLimits(): Promise<any> {
    return this.callApi('limits');
  }

  async getSObjects(): Promise<any> {
    return this.callApi('sobjects');
  }

  async describeSObject(sobjectType: string): Promise<any> {
    return this.callApi(`sobjects/${sobjectType}/describe`);
  }

  async query(soql: string): Promise<any> {
    // Use standard REST API for all queries
    // Note: Tooling API objects should be queried via SalesforceToolingClient
    return this.callApi('query', 'GET', null, { q: soql });
  }

  async queryMore(nextRecordsUrl: string): Promise<any> {
    // nextRecordsUrl is already a full URL, use it directly
    return await this.auth.restRequest(nextRecordsUrl);
  }

  async createRecord(sobjectType: string, data: any): Promise<any> {
    return this.callApi(`sobjects/${sobjectType}`, 'POST', data);
  }

  async getRecord(sobjectType: string, id: string, fields?: string[]): Promise<any> {
    const params = fields ? { fields: fields.join(',') } : {};
    return this.callApi(`sobjects/${sobjectType}/${id}`, 'GET', null, params);
  }

  async updateRecord(sobjectType: string, id: string, data: any): Promise<void> {
    await this.callApi(`sobjects/${sobjectType}/${id}`, 'PATCH', data);
  }

  async deleteRecord(sobjectType: string, id: string): Promise<void> {
    await this.callApi(`sobjects/${sobjectType}/${id}`, 'DELETE');
  }

  // Get authentication info for direct use
  async getAuth(): Promise<{ token: string; instanceUrl: string; apiVersion: string }> {
    const token = await this.auth.getAccessToken();
    const instanceUrl = this.auth.getInstanceUrl();
    const apiVersion = '59.0';

    return { token, instanceUrl, apiVersion };
  }

  // Get Connection for advanced usage
  async getConnection() {
    return await this.auth.getConnection();
  }
}
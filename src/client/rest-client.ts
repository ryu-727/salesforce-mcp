import axios, { AxiosInstance } from 'axios';
import { SalesforceAuth } from '../auth/salesforce-auth.js';
import { SalesforceConfig } from '../types/index.js';
import { SalesforceToolingClient } from './tooling-client.js';

export class SalesforceRestClient {
  private auth: SalesforceAuth;
  private httpClient: AxiosInstance;
  private toolingClient: SalesforceToolingClient;

  constructor(config: SalesforceConfig) {
    this.auth = new SalesforceAuth(config);
    this.toolingClient = new SalesforceToolingClient(config);

    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.httpClient.interceptors.request.use(async (config) => {
      const token = await this.auth.getAccessToken();
      const instanceUrl = this.auth.getInstanceUrl();

      config.headers.Authorization = `Bearer ${token}`;

      if (!config.url?.startsWith('http')) {
        config.url = `${instanceUrl}/services/data/v59.0/${config.url}`;
      }

      return config;
    });

    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.error(
            'Authentication failed. Please check your credentials.'
          );
        }
        if (error.response?.status === 400) {
          console.error(
            error.response.data?.message ||
              'Bad Request. Please check your request parameters.'
          );
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic REST API call
  async callApi(endpoint: string, method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET', body?: any, params?: any): Promise<any> {
    const config: any = {
      method,
      url: endpoint,
      params
    };

    if (body && (method === 'POST' || method === 'PATCH')) {
      config.data = body;
    }

    const response = await this.httpClient(config);
    return response.data;
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
    // Check if query contains Tooling API objects and route accordingly
    const toolingObjects = [
      'AsyncApexJob', 'ApexClass', 'ApexTrigger', 'ApexPage', 'ApexLog', 
      'ApexCodeCoverage', 'ApexCodeCoverageAggregate', 'SymbolTable'
    ];
    
    const containsToolingObject = toolingObjects.some(obj => 
      soql.toLowerCase().includes(obj.toLowerCase())
    );
    
    if (containsToolingObject) {
      // Route to Tooling API
      return this.toolingClient.query(soql);
    }
    
    // Use standard REST API
    return this.callApi('query', 'GET', null, { q: soql });
  }

  async queryMore(nextRecordsUrl: string): Promise<any> {
    const response = await this.httpClient.get(nextRecordsUrl);
    return response.data;
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

  // AsyncApexJob methods (proxied to Tooling API)
  async getAsyncApexJobs(statusFilter?: string, limit: number = 100): Promise<any[]> {
    let soql = 'SELECT Id, Status, JobType, MethodName, JobItemsProcessed, TotalJobItems, NumberOfErrors, CompletedDate, CreatedDate, CreatedBy.Name FROM AsyncApexJob';
    
    if (statusFilter) {
      soql += ` WHERE Status = '${statusFilter}'`;
    }
    
    soql += ` ORDER BY CreatedDate DESC LIMIT ${limit}`;
    
    const result = await this.toolingClient.query(soql);
    return result.records;
  }

  async getAsyncApexJob(jobId: string): Promise<any> {
    const soql = `SELECT Id, Status, JobType, MethodName, JobItemsProcessed, TotalJobItems, NumberOfErrors, CompletedDate, CreatedDate, CreatedBy.Name, ExtendedStatus FROM AsyncApexJob WHERE Id = '${jobId}'`;
    
    const result = await this.toolingClient.query(soql);
    return result.records[0];
  }

  async searchAsyncApexJobs(searchParams: {
    status?: string;
    jobType?: string;
    apexClassName?: string;
    createdDateFrom?: string;
    createdDateTo?: string;
    limit?: number;
  }): Promise<any[]> {
    let soql = 'SELECT Id, Status, JobType, MethodName, JobItemsProcessed, TotalJobItems, NumberOfErrors, CompletedDate, CreatedDate, CreatedBy.Name, ApexClass.Name FROM AsyncApexJob WHERE 1=1';
    
    if (searchParams.status) {
      soql += ` AND Status = '${searchParams.status}'`;
    }
    
    if (searchParams.jobType) {
      soql += ` AND JobType = '${searchParams.jobType}'`;
    }
    
    if (searchParams.apexClassName) {
      soql += ` AND ApexClass.Name LIKE '%${searchParams.apexClassName}%'`;
    }
    
    if (searchParams.createdDateFrom) {
      soql += ` AND CreatedDate >= ${searchParams.createdDateFrom}`;
    }
    
    if (searchParams.createdDateTo) {
      soql += ` AND CreatedDate <= ${searchParams.createdDateTo}`;
    }
    
    soql += ` ORDER BY CreatedDate DESC LIMIT ${searchParams.limit || 100}`;
    
    const result = await this.toolingClient.query(soql);
    return result.records;
  }

  // Get authentication info for direct use
  async getAuth(): Promise<{ token: string; instanceUrl: string; apiVersion: string }> {
    const token = await this.auth.getAccessToken();
    const instanceUrl = this.auth.getInstanceUrl();
    const apiVersion = '59.0';
    
    return { token, instanceUrl, apiVersion };
  }
}
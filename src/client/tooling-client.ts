import axios, { AxiosInstance } from 'axios';
import { SalesforceAuth } from '../auth/salesforce-auth.js';
import {
  SalesforceConfig,
  ToolingApiResponse,
  ApexClass,
  ApexTrigger,
  ApexPage,
  CodeCoverage,
  SymbolTable,
} from '../types/index.js';

export class SalesforceToolingClient {
  private auth: SalesforceAuth;
  private httpClient: AxiosInstance;

  constructor(config: SalesforceConfig) {
    this.auth = new SalesforceAuth(config);

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
      console.log(token);
      const instanceUrl = this.auth.getInstanceUrl();

      config.headers.Authorization = `Bearer ${token}`;

      if (!config.url?.startsWith('http')) {
        config.url = `${instanceUrl}/services/data/v59.0/tooling/${config.url}`;
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

  async query<T = any>(soql: string): Promise<ToolingApiResponse<T>> {
    const response = await this.httpClient.get('query/', {
      params: { q: soql },
    });
    return response.data;
  }

  async queryMore<T = any>(
    nextRecordsUrl: string
  ): Promise<ToolingApiResponse<T>> {
    const response = await this.httpClient.get(nextRecordsUrl);
    return response.data;
  }

  async describe(sobjectType: string): Promise<any> {
    const response = await this.httpClient.get(
      `sobjects/${sobjectType}/describe/`
    );
    return response.data;
  }

  async create(
    sobjectType: string,
    data: any
  ): Promise<{ id: string; success: boolean; errors: any[] }> {
    const response = await this.httpClient.post(
      `sobjects/${sobjectType}/`,
      data
    );
    return response.data;
  }

  async get(sobjectType: string, id: string, fields?: string[]): Promise<any> {
    const params = fields ? { fields: fields.join(',') } : {};
    const response = await this.httpClient.get(
      `sobjects/${sobjectType}/${id}`,
      { params }
    );
    return response.data;
  }

  async update(sobjectType: string, id: string, data: any): Promise<void> {
    await this.httpClient.patch(`sobjects/${sobjectType}/${id}`, data);
  }

  async delete(sobjectType: string, id: string): Promise<void> {
    await this.httpClient.delete(`sobjects/${sobjectType}/${id}`);
  }

  // Apex Class specific methods
  async getApexClasses(nameFilter?: string): Promise<ApexClass[]> {
    let soql =
      'SELECT Id, Name, Body, NamespacePrefix, ApiVersion, Status, IsValid, BodyCrc, LengthWithoutComments, LastModifiedDate, CreatedDate FROM ApexClass';

    if (nameFilter) {
      soql += ` WHERE Name LIKE '%${nameFilter}%'`;
    }

    soql += ' ORDER BY Name';

    const result = await this.query<ApexClass>(soql);
    return result.records;
  }

  async getApexClass(id: string): Promise<ApexClass> {
    return this.get('ApexClass', id);
  }

  async createApexClass(
    name: string,
    body: string
  ): Promise<{ id: string; success: boolean; errors: any[] }> {
    return this.create('ApexClass', { Name: name, Body: body });
  }

  async updateApexClass(id: string, body: string): Promise<void> {
    await this.update('ApexClass', id, { Body: body });
  }

  async deleteApexClass(id: string): Promise<void> {
    await this.delete('ApexClass', id);
  }

  // Apex Trigger specific methods
  async getApexTriggers(nameFilter?: string): Promise<ApexTrigger[]> {
    let soql =
      'SELECT Id, Name, Body, TableEnumOrId, NamespacePrefix, ApiVersion, Status, IsValid, BodyCrc, LengthWithoutComments, LastModifiedDate, CreatedDate FROM ApexTrigger';

    if (nameFilter) {
      soql += ` WHERE Name LIKE '%${nameFilter}%'`;
    }

    soql += ' ORDER BY Name';

    const result = await this.query<ApexTrigger>(soql);
    return result.records;
  }

  async getApexTrigger(id: string): Promise<ApexTrigger> {
    return this.get('ApexTrigger', id);
  }

  async createApexTrigger(
    name: string,
    body: string,
    tableEnumOrId: string
  ): Promise<{ id: string; success: boolean; errors: any[] }> {
    return this.create('ApexTrigger', {
      Name: name,
      Body: body,
      TableEnumOrId: tableEnumOrId,
    });
  }

  async updateApexTrigger(id: string, body: string): Promise<void> {
    await this.update('ApexTrigger', id, { Body: body });
  }

  async deleteApexTrigger(id: string): Promise<void> {
    await this.delete('ApexTrigger', id);
  }

  // Visualforce Page specific methods
  async getApexPages(nameFilter?: string): Promise<ApexPage[]> {
    let soql =
      'SELECT Id, Name, Markup, NamespacePrefix, ApiVersion, MasterLabel, Description, ControllerType, ControllerKey, LastModifiedDate, CreatedDate FROM ApexPage';

    if (nameFilter) {
      soql += ` WHERE Name LIKE '%${nameFilter}%'`;
    }

    soql += ' ORDER BY Name';

    const result = await this.query<ApexPage>(soql);
    return result.records;
  }

  async getApexPage(id: string): Promise<ApexPage> {
    return this.get('ApexPage', id);
  }

  async createApexPage(
    name: string,
    markup: string,
    masterLabel?: string
  ): Promise<{ id: string; success: boolean; errors: any[] }> {
    return this.create('ApexPage', {
      Name: name,
      Markup: markup,
      MasterLabel: masterLabel || name,
    });
  }

  async updateApexPage(id: string, markup: string): Promise<void> {
    await this.update('ApexPage', id, { Markup: markup });
  }

  async deleteApexPage(id: string): Promise<void> {
    await this.delete('ApexPage', id);
  }

  // Code Coverage methods
  async getCodeCoverage(
    apexClassOrTriggerId?: string
  ): Promise<CodeCoverage[]> {
    let soql =
      'SELECT ApexClassOrTriggerId, ApexClassOrTriggerName, NumLinesCovered, NumLinesUncovered, Coverage FROM ApexCodeCoverageAggregate';

    if (apexClassOrTriggerId) {
      soql += ` WHERE ApexClassOrTriggerId = '${apexClassOrTriggerId}'`;
    }

    const result = await this.query<CodeCoverage>(soql);
    return result.records;
  }

  // Symbol Table methods
  async getSymbolTable(apexClassId: string): Promise<SymbolTable> {
    const result = await this.query<SymbolTable>(
      `SELECT Id, Name, SymbolTable FROM ApexClass WHERE Id = '${apexClassId}'`
    );
    return result.records[0];
  }

  // Debug methods
  async getDebugLogs(limit: number = 10): Promise<any[]> {
    const soql = `SELECT Id, Application, DurationMilliseconds, Location, LogLength, LogUser.Name, Operation, Request, StartTime, Status FROM ApexLog ORDER BY StartTime DESC LIMIT ${limit}`;
    const result = await this.query(soql);
    return result.records;
  }

  async getDebugLogBody(logId: string): Promise<string> {
    const response = await this.httpClient.get(
      `sobjects/ApexLog/${logId}/Body`
    );
    return response.data;
  }

  // Test execution methods
  async runTests(classIds?: string[]): Promise<any> {
    const testBody = {
      tests: classIds?.map((id) => ({ classId: id })) || [],
      maxFailedTests: 1,
    };

    const response = await this.httpClient.post(
      'runTestsAsynchronous/',
      testBody
    );
    return response.data;
  }

  async getTestResults(asyncApexJobId: string): Promise<any> {
    const soql = `SELECT Id, Status, JobItemsProcessed, TotalJobItems, NumberOfErrors FROM AsyncApexJob WHERE Id = '${asyncApexJobId}'`;
    const result = await this.query(soql);
    return result.records[0];
  }

  // Organization info (uses regular SOQL API, not Tooling API)
  async getOrgInfo(): Promise<any> {
    const token = await this.auth.getAccessToken();
    const instanceUrl = this.auth.getInstanceUrl();
    
    const response = await axios.get(
      `${instanceUrl}/services/data/v59.0/query`,
      {
        params: {
          q: 'SELECT Id, Name, OrganizationType, InstanceName, IsSandbox FROM Organization LIMIT 1'
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    return response.data.records[0];
  }
}

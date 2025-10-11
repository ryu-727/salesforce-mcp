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

  constructor(config: SalesforceConfig, sharedAuth?: SalesforceAuth) {
    this.auth = sharedAuth || new SalesforceAuth(config);
  }

  async query<T = any>(soql: string): Promise<ToolingApiResponse<T>> {
    const url = `query/?${new URLSearchParams({ q: soql }).toString()}`;
    return await this.auth.toolingRequest(url);
  }

  async queryMore<T = any>(
    nextRecordsUrl: string
  ): Promise<ToolingApiResponse<T>> {
    // nextRecordsUrl is already a full URL, use it directly
    return await this.auth.toolingRequest(nextRecordsUrl);
  }

  async describe(sobjectType: string): Promise<any> {
    return await this.auth.toolingRequest(`sobjects/${sobjectType}/describe/`);
  }

  async create(
    sobjectType: string,
    data: any
  ): Promise<{ id: string; success: boolean; errors: any[] }> {
    return await this.auth.toolingRequest(`sobjects/${sobjectType}/`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async get(sobjectType: string, id: string, fields?: string[]): Promise<any> {
    let url = `sobjects/${sobjectType}/${id}`;
    if (fields) {
      url += `?${new URLSearchParams({ fields: fields.join(',') }).toString()}`;
    }
    return await this.auth.toolingRequest(url);
  }

  async update(sobjectType: string, id: string, data: any): Promise<void> {
    await this.auth.toolingRequest(`sobjects/${sobjectType}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async delete(sobjectType: string, id: string): Promise<void> {
    await this.auth.toolingRequest(`sobjects/${sobjectType}/${id}`, {
      method: 'DELETE'
    });
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
      'SELECT ApexClassOrTriggerId, ApexClassOrTrigger.Name, NumLinesCovered, NumLinesUncovered, Coverage FROM ApexCodeCoverageAggregate';

    if (apexClassOrTriggerId) {
      soql += ` WHERE ApexClassOrTriggerId = '${apexClassOrTriggerId}'`;
    }

    console.log('Debug - getCodeCoverage SOQL:', soql);
    
    try {
      const result = await this.query<CodeCoverage>(soql);
      console.log('Debug - getCodeCoverage result:', JSON.stringify(result, null, 2));
      return result.records;
    } catch (error: any) {
      console.error('Debug - getCodeCoverage error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
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
    return await this.auth.toolingRequest(`sobjects/ApexLog/${logId}/Body`);
  }

  // Test execution methods
  async runTests(classIds?: string[]): Promise<any> {
    const testBody = {
      tests: classIds?.map((id) => ({ classId: id })) || [],
      maxFailedTests: 1,
    };

    return await this.auth.toolingRequest('runTestsAsynchronous/', {
      method: 'POST',
      body: JSON.stringify(testBody),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async getTestResults(asyncApexJobId: string): Promise<any> {
    const soql = `SELECT Id, Status, JobItemsProcessed, TotalJobItems, NumberOfErrors FROM AsyncApexJob WHERE Id = '${asyncApexJobId}'`;
    const result = await this.query(soql);
    return result.records[0];
  }

  // Organization info (uses regular SOQL API, not Tooling API)
  async getOrgInfo(): Promise<any> {
    const soql = 'SELECT Id, Name, OrganizationType, InstanceName, IsSandbox FROM Organization LIMIT 1';
    const url = `query?${new URLSearchParams({ q: soql }).toString()}`;
    const response = await this.auth.restRequest(url);
    return response.records[0];
  }

  // AsyncApexJob methods
  async getAsyncApexJobs(statusFilter?: string, limit: number = 100): Promise<any[]> {
    let soql = 'SELECT Id, Status, JobType, MethodName, JobItemsProcessed, TotalJobItems, NumberOfErrors, CompletedDate, CreatedDate, CreatedBy.Name FROM AsyncApexJob';
    
    if (statusFilter) {
      soql += ` WHERE Status = '${statusFilter}'`;
    }
    
    soql += ` ORDER BY CreatedDate DESC LIMIT ${limit}`;
    
    const result = await this.query(soql);
    return result.records;
  }

  async getAsyncApexJob(jobId: string): Promise<any> {
    const soql = `SELECT Id, Status, JobType, MethodName, JobItemsProcessed, TotalJobItems, NumberOfErrors, CompletedDate, CreatedDate, CreatedBy.Name, ExtendedStatus FROM AsyncApexJob WHERE Id = '${jobId}'`;
    
    const result = await this.query(soql);
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
    let soql = 'SELECT Id, Status, JobType, MethodName, JobItemsProcessed, TotalJobItems, NumberOfErrors, CompletedDate, CreatedDate, CreatedBy.Name, ApexClass.Name FROM AsyncApexJob WHERE Id != NULL';
    
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
    
    const result = await this.query(soql);
    return result.records;
  }
}

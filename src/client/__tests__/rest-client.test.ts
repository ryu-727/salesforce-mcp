import axios from 'axios';
import { SalesforceRestClient } from '../rest-client';
import { SalesforceAuth } from '../../auth/salesforce-auth';
import { SalesforceToolingClient } from '../tooling-client';
import { SalesforceConfig } from '../../types/index';

jest.mock('axios');
jest.mock('../../auth/salesforce-auth');
jest.mock('../tooling-client');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MockedSalesforceAuth = SalesforceAuth as jest.MockedClass<typeof SalesforceAuth>;
const MockedSalesforceToolingClient = SalesforceToolingClient as jest.MockedClass<typeof SalesforceToolingClient>;

describe('SalesforceRestClient', () => {
  let client: SalesforceRestClient;
  let mockHttpClient: any;
  let mockAuth: jest.Mocked<SalesforceAuth>;
  let mockToolingClient: jest.Mocked<SalesforceToolingClient>;
  let config: SalesforceConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    config = {
      instanceUrl: 'https://test.salesforce.com',
      clientId: 'test-client-id',
      username: 'test@example.com',
      password: 'testpass',
      apiVersion: '59.0'
    };

    mockHttpClient = jest.fn().mockImplementation(() => Promise.resolve({ data: {} }));
    Object.assign(mockHttpClient, {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    });

    mockAuth = {
      getAccessToken: jest.fn().mockResolvedValue('fake-token'),
      getInstanceUrl: jest.fn().mockReturnValue('https://test.salesforce.com')
    } as any;

    mockToolingClient = {
      query: jest.fn()
    } as any;

    MockedSalesforceAuth.mockImplementation(() => mockAuth);
    MockedSalesforceToolingClient.mockImplementation(() => mockToolingClient);
    mockedAxios.create.mockReturnValue(mockHttpClient);

    client = new SalesforceRestClient(config);
  });

  describe('constructor', () => {
    it('should create a SalesforceRestClient instance', () => {
      expect(client).toBeInstanceOf(SalesforceRestClient);
      expect(MockedSalesforceAuth).toHaveBeenCalledWith(config);
      expect(MockedSalesforceToolingClient).toHaveBeenCalledWith(config);
      expect(mockedAxios.create).toHaveBeenCalledWith({
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
    });

    it('should setup interceptors', () => {
      expect(mockHttpClient.interceptors.request.use).toHaveBeenCalled();
      expect(mockHttpClient.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('callApi', () => {
    it('should make GET request', async () => {
      const mockResponse = { data: { success: true } };
      mockHttpClient.mockResolvedValue(mockResponse);

      const result = await client.callApi('sobjects');

      expect(mockHttpClient).toHaveBeenCalledWith({
        method: 'GET',
        url: 'sobjects',
        params: undefined
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should make POST request with body', async () => {
      const mockResponse = { data: { id: '123', success: true } };
      const requestBody = { Name: 'Test Account' };
      
      mockHttpClient.mockResolvedValue(mockResponse);

      const result = await client.callApi('sobjects/Account', 'POST', requestBody);

      expect(mockHttpClient).toHaveBeenCalledWith({
        method: 'POST',
        url: 'sobjects/Account',
        params: undefined,
        data: requestBody
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should make PATCH request with body', async () => {
      const mockResponse = { data: {} };
      const requestBody = { Name: 'Updated Account' };
      
      mockHttpClient.mockResolvedValue(mockResponse);

      const result = await client.callApi('sobjects/Account/123', 'PATCH', requestBody);

      expect(mockHttpClient).toHaveBeenCalledWith({
        method: 'PATCH',
        url: 'sobjects/Account/123',
        params: undefined,
        data: requestBody
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should make DELETE request', async () => {
      const mockResponse = { data: {} };
      
      mockHttpClient.mockResolvedValue(mockResponse);

      const result = await client.callApi('sobjects/Account/123', 'DELETE');

      expect(mockHttpClient).toHaveBeenCalledWith({
        method: 'DELETE',
        url: 'sobjects/Account/123',
        params: undefined
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should include query parameters', async () => {
      const mockResponse = { data: { records: [] } };
      const params = { q: 'SELECT Id FROM Account' };
      
      mockHttpClient.mockResolvedValue(mockResponse);

      const result = await client.callApi('query', 'GET', null, params);

      expect(mockHttpClient).toHaveBeenCalledWith({
        method: 'GET',
        url: 'query',
        params: params
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getLimits', () => {
    it('should get organization limits', async () => {
      const mockResponse = { data: { DailyApiRequests: { Remaining: 100000, Max: 100000 } } };
      mockHttpClient.mockResolvedValue(mockResponse);

      const result = await client.getLimits();

      expect(mockHttpClient).toHaveBeenCalledWith({
        method: 'GET',
        url: 'limits',
        params: undefined
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getSObjects', () => {
    it('should get all sobjects', async () => {
      const mockResponse = { data: { sobjects: [{ name: 'Account' }, { name: 'Contact' }] } };
      mockHttpClient.mockResolvedValue(mockResponse);

      const result = await client.getSObjects();

      expect(mockHttpClient).toHaveBeenCalledWith({
        method: 'GET',
        url: 'sobjects',
        params: undefined
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('describeSObject', () => {
    it('should describe sobject', async () => {
      const mockResponse = { data: { name: 'Account', fields: [] } };
      mockHttpClient.mockResolvedValue(mockResponse);

      const result = await client.describeSObject('Account');

      expect(mockHttpClient).toHaveBeenCalledWith({
        method: 'GET',
        url: 'sobjects/Account/describe',
        params: undefined
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('query', () => {
    it('should route tooling API queries to tooling client', async () => {
      const mockResponse = { totalSize: 1, done: true, records: [{ Id: '123' }] };
      mockToolingClient.query.mockResolvedValue(mockResponse);

      const result = await client.query('SELECT Id FROM ApexClass');

      expect(mockToolingClient.query).toHaveBeenCalledWith('SELECT Id FROM ApexClass');
      expect(result).toEqual(mockResponse);
    });

    it('should route standard queries to REST API', async () => {
      const mockResponse = { data: { totalSize: 1, done: true, records: [{ Id: '123' }] } };
      mockHttpClient.mockResolvedValue(mockResponse);

      const result = await client.query('SELECT Id FROM Account');

      expect(mockHttpClient).toHaveBeenCalledWith({
        method: 'GET',
        url: 'query',
        params: { q: 'SELECT Id FROM Account' }
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should detect AsyncApexJob as tooling object', async () => {
      const mockResponse = { totalSize: 1, done: true, records: [{ Id: '123' }] };
      mockToolingClient.query.mockResolvedValue(mockResponse);

      const result = await client.query('SELECT Id FROM AsyncApexJob');

      expect(mockToolingClient.query).toHaveBeenCalledWith('SELECT Id FROM AsyncApexJob');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('queryMore', () => {
    it('should execute queryMore', async () => {
      const mockResponse = { data: { totalSize: 1, done: true, records: [{ Id: '456' }] } };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await client.queryMore('/services/data/v59.0/query/123-abc');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/services/data/v59.0/query/123-abc');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('createRecord', () => {
    it('should create a record', async () => {
      const mockResponse = { data: { id: '123', success: true } };
      const recordData = { Name: 'Test Account' };
      
      mockHttpClient.mockResolvedValue(mockResponse);

      const result = await client.createRecord('Account', recordData);

      expect(mockHttpClient).toHaveBeenCalledWith({
        method: 'POST',
        url: 'sobjects/Account',
        params: undefined,
        data: recordData
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getRecord', () => {
    it('should get a record by id', async () => {
      const mockResponse = { data: { Id: '123', Name: 'Test Account' } };
      mockHttpClient.mockResolvedValue(mockResponse);

      const result = await client.getRecord('Account', '123');

      expect(mockHttpClient).toHaveBeenCalledWith({
        method: 'GET',
        url: 'sobjects/Account/123',
        params: {}
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should get a record with specific fields', async () => {
      const mockResponse = { data: { Id: '123', Name: 'Test Account' } };
      mockHttpClient.mockResolvedValue(mockResponse);

      const result = await client.getRecord('Account', '123', ['Id', 'Name']);

      expect(mockHttpClient).toHaveBeenCalledWith({
        method: 'GET',
        url: 'sobjects/Account/123',
        params: { fields: 'Id,Name' }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateRecord', () => {
    it('should update a record', async () => {
      const mockResponse = { data: {} };
      const updateData = { Name: 'Updated Account' };
      
      mockHttpClient.mockResolvedValue(mockResponse);

      await client.updateRecord('Account', '123', updateData);

      expect(mockHttpClient).toHaveBeenCalledWith({
        method: 'PATCH',
        url: 'sobjects/Account/123',
        params: undefined,
        data: updateData
      });
    });
  });

  describe('deleteRecord', () => {
    it('should delete a record', async () => {
      const mockResponse = { data: {} };
      mockHttpClient.mockResolvedValue(mockResponse);

      await client.deleteRecord('Account', '123');

      expect(mockHttpClient).toHaveBeenCalledWith({
        method: 'DELETE',
        url: 'sobjects/Account/123',
        params: undefined
      });
    });
  });

  describe('getAsyncApexJobs', () => {
    it('should get all async apex jobs', async () => {
      const mockResponse = { totalSize: 1, done: true, records: [{ Id: 'job123' }] };
      mockToolingClient.query.mockResolvedValue(mockResponse);

      const result = await client.getAsyncApexJobs();

      expect(mockToolingClient.query).toHaveBeenCalledWith(
        'SELECT Id, Status, JobType, MethodName, JobItemsProcessed, TotalJobItems, NumberOfErrors, CompletedDate, CreatedDate, CreatedBy.Name FROM AsyncApexJob ORDER BY CreatedDate DESC LIMIT 100'
      );
      expect(result).toEqual(mockResponse.records);
    });

    it('should get async apex jobs with status filter', async () => {
      const mockResponse = { totalSize: 1, done: true, records: [{ Id: 'job123' }] };
      mockToolingClient.query.mockResolvedValue(mockResponse);

      const result = await client.getAsyncApexJobs('Completed', 50);

      expect(mockToolingClient.query).toHaveBeenCalledWith(
        "SELECT Id, Status, JobType, MethodName, JobItemsProcessed, TotalJobItems, NumberOfErrors, CompletedDate, CreatedDate, CreatedBy.Name FROM AsyncApexJob WHERE Status = 'Completed' ORDER BY CreatedDate DESC LIMIT 50"
      );
      expect(result).toEqual(mockResponse.records);
    });
  });

  describe('getAsyncApexJob', () => {
    it('should get a specific async apex job', async () => {
      const mockResponse = { totalSize: 1, done: true, records: [{ Id: 'job123', Status: 'Completed' }] };
      mockToolingClient.query.mockResolvedValue(mockResponse);

      const result = await client.getAsyncApexJob('job123');

      expect(mockToolingClient.query).toHaveBeenCalledWith(
        "SELECT Id, Status, JobType, MethodName, JobItemsProcessed, TotalJobItems, NumberOfErrors, CompletedDate, CreatedDate, CreatedBy.Name, ExtendedStatus FROM AsyncApexJob WHERE Id = 'job123'"
      );
      expect(result).toEqual(mockResponse.records[0]);
    });
  });

  describe('searchAsyncApexJobs', () => {
    it('should search async apex jobs with all filters', async () => {
      const mockResponse = { totalSize: 1, done: true, records: [{ Id: 'job123' }] };
      mockToolingClient.query.mockResolvedValue(mockResponse);

      const searchParams = {
        status: 'Completed',
        jobType: 'BatchApex',
        apexClassName: 'TestBatch',
        createdDateFrom: '2023-01-01T00:00:00Z',
        createdDateTo: '2023-12-31T23:59:59Z',
        limit: 50
      };

      const result = await client.searchAsyncApexJobs(searchParams);

      expect(mockToolingClient.query).toHaveBeenCalledWith(
        "SELECT Id, Status, JobType, MethodName, JobItemsProcessed, TotalJobItems, NumberOfErrors, CompletedDate, CreatedDate, CreatedBy.Name, ApexClass.Name FROM AsyncApexJob WHERE 1=1 AND Status = 'Completed' AND JobType = 'BatchApex' AND ApexClass.Name LIKE '%TestBatch%' AND CreatedDate >= 2023-01-01T00:00:00Z AND CreatedDate <= 2023-12-31T23:59:59Z ORDER BY CreatedDate DESC LIMIT 50"
      );
      expect(result).toEqual(mockResponse.records);
    });

    it('should search async apex jobs without filters', async () => {
      const mockResponse = { totalSize: 1, done: true, records: [{ Id: 'job123' }] };
      mockToolingClient.query.mockResolvedValue(mockResponse);

      const result = await client.searchAsyncApexJobs({});

      expect(mockToolingClient.query).toHaveBeenCalledWith(
        'SELECT Id, Status, JobType, MethodName, JobItemsProcessed, TotalJobItems, NumberOfErrors, CompletedDate, CreatedDate, CreatedBy.Name, ApexClass.Name FROM AsyncApexJob WHERE 1=1 ORDER BY CreatedDate DESC LIMIT 100'
      );
      expect(result).toEqual(mockResponse.records);
    });
  });

  describe('getAuth', () => {
    it('should get authentication info', async () => {
      mockAuth.getAccessToken.mockResolvedValue('test-token');
      mockAuth.getInstanceUrl.mockReturnValue('https://test.salesforce.com');

      const result = await client.getAuth();

      expect(mockAuth.getAccessToken).toHaveBeenCalled();
      expect(mockAuth.getInstanceUrl).toHaveBeenCalled();
      expect(result).toEqual({
        token: 'test-token',
        instanceUrl: 'https://test.salesforce.com',
        apiVersion: '59.0'
      });
    });
  });
});
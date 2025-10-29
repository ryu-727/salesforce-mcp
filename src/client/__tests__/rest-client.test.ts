import { SalesforceRestClient } from '../rest-client';
import { SalesforceAuth } from '../../auth/salesforce-auth';
import { SalesforceConfig } from '../../types/index';

jest.mock('../../auth/salesforce-auth');

const MockedSalesforceAuth = SalesforceAuth as jest.MockedClass<typeof SalesforceAuth>;

describe('SalesforceRestClient', () => {
  let client: SalesforceRestClient;
  let mockAuth: jest.Mocked<SalesforceAuth>;
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

    mockAuth = {
      restRequest: jest.fn().mockResolvedValue({}),
      getConnection: jest.fn().mockResolvedValue({})
    } as any;

    MockedSalesforceAuth.mockImplementation(() => mockAuth);

    client = new SalesforceRestClient(config);
  });

  describe('constructor', () => {
    it('should create a SalesforceRestClient instance', () => {
      expect(client).toBeInstanceOf(SalesforceRestClient);
      expect(MockedSalesforceAuth).toHaveBeenCalledWith(config);
    });
  });

  describe('callApi', () => {
    it('should make GET request', async () => {
      const mockResponse = { success: true };
      mockAuth.restRequest.mockResolvedValue(mockResponse);

      const result = await client.callApi('sobjects');

      expect(mockAuth.restRequest).toHaveBeenCalledWith('sobjects', { method: 'GET' });
      expect(result).toEqual(mockResponse);
    });

    it('should make POST request with body', async () => {
      const mockResponse = { id: '123', success: true };
      const requestBody = { Name: 'Test Account' };

      mockAuth.restRequest.mockResolvedValue(mockResponse);

      const result = await client.callApi('sobjects/Account', 'POST', requestBody);

      expect(mockAuth.restRequest).toHaveBeenCalledWith('sobjects/Account', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });
      expect(result).toEqual(mockResponse);
    });

    it('should make PATCH request with body', async () => {
      const mockResponse = {};
      const requestBody = { Name: 'Updated Account' };

      mockAuth.restRequest.mockResolvedValue(mockResponse);

      const result = await client.callApi('sobjects/Account/123', 'PATCH', requestBody);

      expect(mockAuth.restRequest).toHaveBeenCalledWith('sobjects/Account/123', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });
      expect(result).toEqual(mockResponse);
    });

    it('should make DELETE request', async () => {
      const mockResponse = {};

      mockAuth.restRequest.mockResolvedValue(mockResponse);

      const result = await client.callApi('sobjects/Account/123', 'DELETE');

      expect(mockAuth.restRequest).toHaveBeenCalledWith('sobjects/Account/123', { method: 'DELETE' });
      expect(result).toEqual(mockResponse);
    });

    it('should include query parameters', async () => {
      const mockResponse = { records: [] };
      const params = { q: 'SELECT Id FROM Account' };

      mockAuth.restRequest.mockResolvedValue(mockResponse);

      const result = await client.callApi('query', 'GET', null, params);

      expect(mockAuth.restRequest).toHaveBeenCalledWith('query?q=SELECT+Id+FROM+Account', { method: 'GET' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getLimits', () => {
    it('should get organization limits', async () => {
      const mockResponse = { DailyApiRequests: { Remaining: 100000, Max: 100000 } };
      mockAuth.restRequest.mockResolvedValue(mockResponse);

      const result = await client.getLimits();

      expect(mockAuth.restRequest).toHaveBeenCalledWith('/limits', { method: 'GET' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getSObjects', () => {
    it('should get all sobjects', async () => {
      const mockResponse = { sobjects: [{ name: 'Account' }, { name: 'Contact' }] };
      mockAuth.restRequest.mockResolvedValue(mockResponse);

      const result = await client.getSObjects();

      expect(mockAuth.restRequest).toHaveBeenCalledWith('/sobjects', { method: 'GET' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('describeSObject', () => {
    it('should describe sobject', async () => {
      const mockResponse = { name: 'Account', fields: [] };
      mockAuth.restRequest.mockResolvedValue(mockResponse);

      const result = await client.describeSObject('Account');

      expect(mockAuth.restRequest).toHaveBeenCalledWith('/sobjects/Account/describe', { method: 'GET' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('query', () => {
    it('should execute query using REST API', async () => {
      const mockResponse = { totalSize: 1, done: true, records: [{ Id: '123' }] };
      mockAuth.restRequest.mockResolvedValue(mockResponse);

      const result = await client.query('SELECT Id FROM Account');

      expect(mockAuth.restRequest).toHaveBeenCalledWith('/query?q=SELECT+Id+FROM+Account', { method: 'GET' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('queryMore', () => {
    it('should execute queryMore', async () => {
      const mockResponse = { totalSize: 1, done: true, records: [{ Id: '456' }] };
      mockAuth.restRequest.mockResolvedValue(mockResponse);

      const result = await client.queryMore('/services/data/v59.0/query/123-abc');

      expect(mockAuth.restRequest).toHaveBeenCalledWith('/services/data/v59.0/query/123-abc');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createRecord', () => {
    it('should create a record', async () => {
      const mockResponse = { id: '123', success: true };
      const recordData = { Name: 'Test Account' };

      mockAuth.restRequest.mockResolvedValue(mockResponse);

      const result = await client.createRecord('Account', recordData);

      expect(mockAuth.restRequest).toHaveBeenCalledWith('/sobjects/Account', {
        method: 'POST',
        body: JSON.stringify(recordData),
        headers: { 'Content-Type': 'application/json' }
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getRecord', () => {
    it('should get a record by id', async () => {
      const mockResponse = { Id: '123', Name: 'Test Account' };
      mockAuth.restRequest.mockResolvedValue(mockResponse);

      const result = await client.getRecord('Account', '123');

      expect(mockAuth.restRequest).toHaveBeenCalledWith('/sobjects/Account/123', { method: 'GET' });
      expect(result).toEqual(mockResponse);
    });

    it('should get a record with specific fields', async () => {
      const mockResponse = { Id: '123', Name: 'Test Account' };
      mockAuth.restRequest.mockResolvedValue(mockResponse);

      const result = await client.getRecord('Account', '123', ['Id', 'Name']);

      expect(mockAuth.restRequest).toHaveBeenCalledWith('/sobjects/Account/123?fields=Id%2CName', { method: 'GET' });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateRecord', () => {
    it('should update a record', async () => {
      const mockResponse = {};
      const updateData = { Name: 'Updated Account' };

      mockAuth.restRequest.mockResolvedValue(mockResponse);

      await client.updateRecord('Account', '123', updateData);

      expect(mockAuth.restRequest).toHaveBeenCalledWith('/sobjects/Account/123', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' }
      });
    });
  });

  describe('deleteRecord', () => {
    it('should delete a record', async () => {
      const mockResponse = {};
      mockAuth.restRequest.mockResolvedValue(mockResponse);

      await client.deleteRecord('Account', '123');

      expect(mockAuth.restRequest).toHaveBeenCalledWith('/sobjects/Account/123', { method: 'DELETE' });
    });
  });
});
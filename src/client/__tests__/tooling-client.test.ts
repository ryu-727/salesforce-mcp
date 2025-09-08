import axios from 'axios';
import { SalesforceToolingClient } from '../tooling-client';
import { SalesforceAuth } from '../../auth/salesforce-auth';
import { SalesforceConfig } from '../../types/index';

jest.mock('axios');
jest.mock('../../auth/salesforce-auth');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MockedSalesforceAuth = SalesforceAuth as jest.MockedClass<typeof SalesforceAuth>;

describe('SalesforceToolingClient', () => {
  let client: SalesforceToolingClient;
  let mockHttpClient: any;
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

    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    };

    mockAuth = {
      getAccessToken: jest.fn().mockResolvedValue('fake-token'),
      getInstanceUrl: jest.fn().mockReturnValue('https://test.salesforce.com')
    } as any;

    MockedSalesforceAuth.mockImplementation(() => mockAuth);
    mockedAxios.create.mockReturnValue(mockHttpClient);

    client = new SalesforceToolingClient(config);
  });

  describe('constructor', () => {
    it('should create a SalesforceToolingClient instance', () => {
      expect(client).toBeInstanceOf(SalesforceToolingClient);
      expect(MockedSalesforceAuth).toHaveBeenCalledWith(config);
      expect(mockedAxios.create).toHaveBeenCalledWith({
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
    });

    it('should create a SalesforceToolingClient instance with shared auth', () => {
      const sharedAuth = new SalesforceAuth(config);
      const clientWithSharedAuth = new SalesforceToolingClient(config, sharedAuth);
      
      expect(clientWithSharedAuth).toBeInstanceOf(SalesforceToolingClient);
      // Should not create a new auth instance when sharedAuth is provided
    });

    it('should setup interceptors', () => {
      expect(mockHttpClient.interceptors.request.use).toHaveBeenCalled();
      expect(mockHttpClient.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('query', () => {
    it('should execute SOQL query', async () => {
      const mockResponse = {
        data: {
          totalSize: 1,
          done: true,
          records: [{ Id: '123', Name: 'TestClass' }]
        }
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await client.query('SELECT Id, Name FROM ApexClass');

      expect(mockHttpClient.get).toHaveBeenCalledWith('query/', {
        params: { q: 'SELECT Id, Name FROM ApexClass' }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('queryMore', () => {
    it('should execute queryMore', async () => {
      const mockResponse = {
        data: {
          totalSize: 1,
          done: true,
          records: [{ Id: '456', Name: 'TestClass2' }]
        }
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await client.queryMore('/services/data/v59.0/tooling/queryMore/...');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/services/data/v59.0/tooling/queryMore/...');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('describe', () => {
    it('should describe sobject type', async () => {
      const mockResponse = {
        data: {
          name: 'ApexClass',
          fields: []
        }
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await client.describe('ApexClass');

      expect(mockHttpClient.get).toHaveBeenCalledWith('sobjects/ApexClass/describe/');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('create', () => {
    it('should create a new record', async () => {
      const mockResponse = {
        data: {
          id: '123',
          success: true,
          errors: []
        }
      };

      mockHttpClient.post.mockResolvedValue(mockResponse);

      const data = { Name: 'TestClass', Body: 'public class TestClass {}' };
      const result = await client.create('ApexClass', data);

      expect(mockHttpClient.post).toHaveBeenCalledWith('sobjects/ApexClass/', data);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('get', () => {
    it('should get a record by id', async () => {
      const mockResponse = {
        data: { Id: '123', Name: 'TestClass', Body: 'public class TestClass {}' }
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await client.get('ApexClass', '123');

      expect(mockHttpClient.get).toHaveBeenCalledWith('sobjects/ApexClass/123', { params: {} });
      expect(result).toEqual(mockResponse.data);
    });

    it('should get a record with specific fields', async () => {
      const mockResponse = {
        data: { Id: '123', Name: 'TestClass' }
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await client.get('ApexClass', '123', ['Id', 'Name']);

      expect(mockHttpClient.get).toHaveBeenCalledWith('sobjects/ApexClass/123', {
        params: { fields: 'Id,Name' }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('update', () => {
    it('should update a record', async () => {
      mockHttpClient.patch.mockResolvedValue({ data: {} });

      const data = { Body: 'public class UpdatedTestClass {}' };
      await client.update('ApexClass', '123', data);

      expect(mockHttpClient.patch).toHaveBeenCalledWith('sobjects/ApexClass/123', data);
    });
  });

  describe('delete', () => {
    it('should delete a record', async () => {
      mockHttpClient.delete.mockResolvedValue({ data: {} });

      await client.delete('ApexClass', '123');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('sobjects/ApexClass/123');
    });
  });

  describe('getApexClasses', () => {
    it('should get all apex classes', async () => {
      const mockResponse = {
        data: {
          records: [
            { Id: '123', Name: 'TestClass1', Body: 'public class TestClass1 {}' },
            { Id: '456', Name: 'TestClass2', Body: 'public class TestClass2 {}' }
          ]
        }
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await client.getApexClasses();

      expect(mockHttpClient.get).toHaveBeenCalledWith('query/', {
        params: { 
          q: 'SELECT Id, Name, Body, NamespacePrefix, ApiVersion, Status, IsValid, BodyCrc, LengthWithoutComments, LastModifiedDate, CreatedDate FROM ApexClass ORDER BY Name'
        }
      });
      expect(result).toEqual(mockResponse.data.records);
    });

    it('should get apex classes with name filter', async () => {
      const mockResponse = {
        data: {
          records: [
            { Id: '123', Name: 'TestClass', Body: 'public class TestClass {}' }
          ]
        }
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await client.getApexClasses('Test');

      expect(mockHttpClient.get).toHaveBeenCalledWith('query/', {
        params: { 
          q: "SELECT Id, Name, Body, NamespacePrefix, ApiVersion, Status, IsValid, BodyCrc, LengthWithoutComments, LastModifiedDate, CreatedDate FROM ApexClass WHERE Name LIKE '%Test%' ORDER BY Name"
        }
      });
      expect(result).toEqual(mockResponse.data.records);
    });
  });

  describe('getApexClass', () => {
    it('should get a specific apex class', async () => {
      const mockResponse = {
        data: { Id: '123', Name: 'TestClass', Body: 'public class TestClass {}' }
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await client.getApexClass('123');

      expect(mockHttpClient.get).toHaveBeenCalledWith('sobjects/ApexClass/123', { params: {} });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('createApexClass', () => {
    it('should create a new apex class', async () => {
      const mockResponse = {
        data: {
          id: '123',
          success: true,
          errors: []
        }
      };

      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await client.createApexClass('TestClass', 'public class TestClass {}');

      expect(mockHttpClient.post).toHaveBeenCalledWith('sobjects/ApexClass/', {
        Name: 'TestClass',
        Body: 'public class TestClass {}'
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateApexClass', () => {
    it('should update an apex class', async () => {
      mockHttpClient.patch.mockResolvedValue({ data: {} });

      await client.updateApexClass('123', 'public class UpdatedTestClass {}');

      expect(mockHttpClient.patch).toHaveBeenCalledWith('sobjects/ApexClass/123', {
        Body: 'public class UpdatedTestClass {}'
      });
    });
  });

  describe('deleteApexClass', () => {
    it('should delete an apex class', async () => {
      mockHttpClient.delete.mockResolvedValue({ data: {} });

      await client.deleteApexClass('123');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('sobjects/ApexClass/123');
    });
  });

  describe('getCodeCoverage', () => {
    it('should get code coverage for all classes', async () => {
      const mockResponse = {
        data: {
          records: [
            {
              ApexClassOrTriggerId: '123',
              ApexClassOrTriggerName: 'TestClass',
              NumLinesCovered: 10,
              NumLinesUncovered: 5,
              Coverage: { coveredLines: [1, 2, 3], uncoveredLines: [4, 5] }
            }
          ]
        }
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await client.getCodeCoverage();

      expect(mockHttpClient.get).toHaveBeenCalledWith('query/', {
        params: { 
          q: 'SELECT ApexClassOrTriggerId, ApexClassOrTrigger.Name, NumLinesCovered, NumLinesUncovered, Coverage FROM ApexCodeCoverageAggregate'
        }
      });
      expect(result).toEqual(mockResponse.data.records);
    });

    it('should get code coverage for specific class', async () => {
      const mockResponse = {
        data: {
          records: [
            {
              ApexClassOrTriggerId: '123',
              ApexClassOrTriggerName: 'TestClass',
              NumLinesCovered: 10,
              NumLinesUncovered: 5,
              Coverage: { coveredLines: [1, 2, 3], uncoveredLines: [4, 5] }
            }
          ]
        }
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await client.getCodeCoverage('123');

      expect(mockHttpClient.get).toHaveBeenCalledWith('query/', {
        params: { 
          q: "SELECT ApexClassOrTriggerId, ApexClassOrTrigger.Name, NumLinesCovered, NumLinesUncovered, Coverage FROM ApexCodeCoverageAggregate WHERE ApexClassOrTriggerId = '123'"
        }
      });
      expect(result).toEqual(mockResponse.data.records);
    });
  });

  describe('runTests', () => {
    it('should run tests', async () => {
      const mockResponse = {
        data: { AsyncApexJobId: 'job123' }
      };

      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await client.runTests(['class123', 'class456']);

      expect(mockHttpClient.post).toHaveBeenCalledWith('runTestsAsynchronous/', {
        tests: [{ classId: 'class123' }, { classId: 'class456' }],
        maxFailedTests: 1
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should run tests without class ids', async () => {
      const mockResponse = {
        data: { AsyncApexJobId: 'job123' }
      };

      mockHttpClient.post.mockResolvedValue(mockResponse);

      const result = await client.runTests();

      expect(mockHttpClient.post).toHaveBeenCalledWith('runTestsAsynchronous/', {
        tests: [],
        maxFailedTests: 1
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getTestResults', () => {
    it('should get test results', async () => {
      const mockResponse = {
        data: {
          records: [{
            Id: 'job123',
            Status: 'Completed',
            JobItemsProcessed: 5,
            TotalJobItems: 5,
            NumberOfErrors: 0
          }]
        }
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await client.getTestResults('job123');

      expect(mockHttpClient.get).toHaveBeenCalledWith('query/', {
        params: { 
          q: "SELECT Id, Status, JobItemsProcessed, TotalJobItems, NumberOfErrors FROM AsyncApexJob WHERE Id = 'job123'"
        }
      });
      expect(result).toEqual(mockResponse.data.records[0]);
    });
  });

  describe('getOrgInfo', () => {
    it('should get organization info', async () => {
      const mockResponse = {
        data: {
          records: [{
            Id: '00D123456789012',
            Name: 'Test Org',
            OrganizationType: 'Developer Edition',
            InstanceName: 'CS123',
            IsSandbox: false
          }]
        }
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await client.getOrgInfo();

      expect(mockAuth.getAccessToken).toHaveBeenCalled();
      expect(mockAuth.getInstanceUrl).toHaveBeenCalled();
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test.salesforce.com/services/data/v59.0/query',
        {
          params: {
            q: 'SELECT Id, Name, OrganizationType, InstanceName, IsSandbox FROM Organization LIMIT 1'
          },
          headers: {
            'Authorization': 'Bearer fake-token',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      expect(result).toEqual(mockResponse.data.records[0]);
    });
  });

  describe('getAsyncApexJobs', () => {
    it('should get all async apex jobs', async () => {
      const mockResponse = {
        data: {
          records: [{ Id: 'job123', Status: 'Completed' }]
        }
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await client.getAsyncApexJobs();

      expect(mockHttpClient.get).toHaveBeenCalledWith('query/', {
        params: { 
          q: 'SELECT Id, Status, JobType, MethodName, JobItemsProcessed, TotalJobItems, NumberOfErrors, CompletedDate, CreatedDate, CreatedBy.Name FROM AsyncApexJob ORDER BY CreatedDate DESC LIMIT 100'
        }
      });
      expect(result).toEqual(mockResponse.data.records);
    });

    it('should get async apex jobs with status filter', async () => {
      const mockResponse = {
        data: {
          records: [{ Id: 'job123', Status: 'Completed' }]
        }
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await client.getAsyncApexJobs('Completed', 50);

      expect(mockHttpClient.get).toHaveBeenCalledWith('query/', {
        params: { 
          q: "SELECT Id, Status, JobType, MethodName, JobItemsProcessed, TotalJobItems, NumberOfErrors, CompletedDate, CreatedDate, CreatedBy.Name FROM AsyncApexJob WHERE Status = 'Completed' ORDER BY CreatedDate DESC LIMIT 50"
        }
      });
      expect(result).toEqual(mockResponse.data.records);
    });
  });

  describe('getAsyncApexJob', () => {
    it('should get a specific async apex job', async () => {
      const mockResponse = {
        data: {
          records: [{ Id: 'job123', Status: 'Completed', ExtendedStatus: null }]
        }
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await client.getAsyncApexJob('job123');

      expect(mockHttpClient.get).toHaveBeenCalledWith('query/', {
        params: { 
          q: "SELECT Id, Status, JobType, MethodName, JobItemsProcessed, TotalJobItems, NumberOfErrors, CompletedDate, CreatedDate, CreatedBy.Name, ExtendedStatus FROM AsyncApexJob WHERE Id = 'job123'"
        }
      });
      expect(result).toEqual(mockResponse.data.records[0]);
    });
  });

  describe('searchAsyncApexJobs', () => {
    it('should search async apex jobs with all filters', async () => {
      const mockResponse = {
        data: {
          records: [{ Id: 'job123', Status: 'Completed', JobType: 'BatchApex' }]
        }
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const searchParams = {
        status: 'Completed',
        jobType: 'BatchApex',
        apexClassName: 'TestBatch',
        createdDateFrom: '2023-01-01T00:00:00Z',
        createdDateTo: '2023-12-31T23:59:59Z',
        limit: 50
      };

      const result = await client.searchAsyncApexJobs(searchParams);

      expect(mockHttpClient.get).toHaveBeenCalledWith('query/', {
        params: { 
          q: "SELECT Id, Status, JobType, MethodName, JobItemsProcessed, TotalJobItems, NumberOfErrors, CompletedDate, CreatedDate, CreatedBy.Name, ApexClass.Name FROM AsyncApexJob WHERE Id != NULL AND Status = 'Completed' AND JobType = 'BatchApex' AND ApexClass.Name LIKE '%TestBatch%' AND CreatedDate >= 2023-01-01T00:00:00Z AND CreatedDate <= 2023-12-31T23:59:59Z ORDER BY CreatedDate DESC LIMIT 50"
        }
      });
      expect(result).toEqual(mockResponse.data.records);
    });

    it('should search async apex jobs without filters', async () => {
      const mockResponse = {
        data: {
          records: [{ Id: 'job123', Status: 'Completed' }]
        }
      };

      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await client.searchAsyncApexJobs({});

      expect(mockHttpClient.get).toHaveBeenCalledWith('query/', {
        params: { 
          q: 'SELECT Id, Status, JobType, MethodName, JobItemsProcessed, TotalJobItems, NumberOfErrors, CompletedDate, CreatedDate, CreatedBy.Name, ApexClass.Name FROM AsyncApexJob WHERE Id != NULL ORDER BY CreatedDate DESC LIMIT 100'
        }
      });
      expect(result).toEqual(mockResponse.data.records);
    });
  });
});
import { SalesforceToolingClient } from '../tooling-client';
import { SalesforceAuth } from '../../auth/salesforce-auth';
import { SalesforceConfig } from '../../types/index';

jest.mock('../../auth/salesforce-auth');

const MockedSalesforceAuth = SalesforceAuth as jest.MockedClass<typeof SalesforceAuth>;

describe('SalesforceToolingClient', () => {
  let client: SalesforceToolingClient;
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
      toolingRequest: jest.fn().mockResolvedValue({}),
      restRequest: jest.fn().mockResolvedValue({})
    } as any;

    MockedSalesforceAuth.mockImplementation(() => mockAuth);

    client = new SalesforceToolingClient(config);
  });

  describe('constructor', () => {
    it('should create a SalesforceToolingClient instance', () => {
      expect(client).toBeInstanceOf(SalesforceToolingClient);
      expect(MockedSalesforceAuth).toHaveBeenCalledWith(config);
    });

    it('should create a SalesforceToolingClient instance with shared auth', () => {
      const sharedAuth = new SalesforceAuth(config);
      const clientWithSharedAuth = new SalesforceToolingClient(config, sharedAuth);

      expect(clientWithSharedAuth).toBeInstanceOf(SalesforceToolingClient);
    });
  });

  describe('query', () => {
    it('should execute SOQL query', async () => {
      const mockResponse = {
        totalSize: 1,
        done: true,
        records: [{ Id: '123', Name: 'TestClass' }]
      };

      mockAuth.toolingRequest.mockResolvedValue(mockResponse);

      const result = await client.query('SELECT Id, Name FROM ApexClass');

      expect(mockAuth.toolingRequest).toHaveBeenCalledWith('/query/?q=SELECT+Id%2C+Name+FROM+ApexClass');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('queryMore', () => {
    it('should execute queryMore', async () => {
      const mockResponse = {
        totalSize: 1,
        done: true,
        records: [{ Id: '456', Name: 'TestClass2' }]
      };

      mockAuth.toolingRequest.mockResolvedValue(mockResponse);

      const result = await client.queryMore('/services/data/v59.0/tooling/queryMore/...');

      expect(mockAuth.toolingRequest).toHaveBeenCalledWith('/services/data/v59.0/tooling/queryMore/...');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('describe', () => {
    it('should describe sobject type', async () => {
      const mockResponse = {
        name: 'ApexClass',
        fields: []
      };

      mockAuth.toolingRequest.mockResolvedValue(mockResponse);

      const result = await client.describe('ApexClass');

      expect(mockAuth.toolingRequest).toHaveBeenCalledWith('/sobjects/ApexClass/describe/');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('create', () => {
    it('should create a new record', async () => {
      const mockResponse = {
        id: '123',
        success: true,
        errors: []
      };

      mockAuth.toolingRequest.mockResolvedValue(mockResponse);

      const data = { Name: 'TestClass', Body: 'public class TestClass {}' };
      const result = await client.create('ApexClass', data);

      expect(mockAuth.toolingRequest).toHaveBeenCalledWith('/sobjects/ApexClass/', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('get', () => {
    it('should get a record by id', async () => {
      const mockResponse = { Id: '123', Name: 'TestClass', Body: 'public class TestClass {}' };

      mockAuth.toolingRequest.mockResolvedValue(mockResponse);

      const result = await client.get('ApexClass', '123');

      expect(mockAuth.toolingRequest).toHaveBeenCalledWith('/sobjects/ApexClass/123');
      expect(result).toEqual(mockResponse);
    });

    it('should get a record with specific fields', async () => {
      const mockResponse = { Id: '123', Name: 'TestClass' };

      mockAuth.toolingRequest.mockResolvedValue(mockResponse);

      const result = await client.get('ApexClass', '123', ['Id', 'Name']);

      expect(mockAuth.toolingRequest).toHaveBeenCalledWith('/sobjects/ApexClass/123?fields=Id%2CName');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('update', () => {
    it('should update a record', async () => {
      mockAuth.toolingRequest.mockResolvedValue({});

      const data = { Body: 'public class UpdatedTestClass {}' };
      await client.update('ApexClass', '123', data);

      expect(mockAuth.toolingRequest).toHaveBeenCalledWith('/sobjects/ApexClass/123', {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
    });
  });

  describe('delete', () => {
    it('should delete a record', async () => {
      mockAuth.toolingRequest.mockResolvedValue({});

      await client.delete('ApexClass', '123');

      expect(mockAuth.toolingRequest).toHaveBeenCalledWith('/sobjects/ApexClass/123', {
        method: 'DELETE'
      });
    });
  });

  describe('getApexClasses', () => {
    it('should get all apex classes', async () => {
      const mockResponse = {
        records: [
          { Id: '123', Name: 'TestClass1', Body: 'public class TestClass1 {}' },
          { Id: '456', Name: 'TestClass2', Body: 'public class TestClass2 {}' }
        ]
      };

      mockAuth.toolingRequest.mockResolvedValue(mockResponse);

      const result = await client.getApexClasses();

      expect(mockAuth.toolingRequest).toHaveBeenCalledWith('/query/?q=SELECT+Id%2C+Name%2C+Body%2C+NamespacePrefix%2C+ApiVersion%2C+Status%2C+IsValid%2C+BodyCrc%2C+LengthWithoutComments%2C+LastModifiedDate%2C+CreatedDate+FROM+ApexClass+ORDER+BY+Name');
      expect(result).toEqual(mockResponse.records);
    });

    it('should get apex classes with name filter', async () => {
      const mockResponse = {
        records: [
          { Id: '123', Name: 'TestClass', Body: 'public class TestClass {}' }
        ]
      };

      mockAuth.toolingRequest.mockResolvedValue(mockResponse);

      const result = await client.getApexClasses('Test');

      expect(mockAuth.toolingRequest).toHaveBeenCalledWith('/query/?q=SELECT+Id%2C+Name%2C+Body%2C+NamespacePrefix%2C+ApiVersion%2C+Status%2C+IsValid%2C+BodyCrc%2C+LengthWithoutComments%2C+LastModifiedDate%2C+CreatedDate+FROM+ApexClass+WHERE+Name+LIKE+%27%25Test%25%27+ORDER+BY+Name');
      expect(result).toEqual(mockResponse.records);
    });
  });

  describe('getApexClass', () => {
    it('should get a specific apex class', async () => {
      const mockResponse = { Id: '123', Name: 'TestClass', Body: 'public class TestClass {}' };

      mockAuth.toolingRequest.mockResolvedValue(mockResponse);

      const result = await client.getApexClass('123');

      expect(mockAuth.toolingRequest).toHaveBeenCalledWith('/sobjects/ApexClass/123');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createApexClass', () => {
    it('should create a new apex class', async () => {
      const mockResponse = {
        id: '123',
        success: true,
        errors: []
      };

      mockAuth.toolingRequest.mockResolvedValue(mockResponse);

      const result = await client.createApexClass('TestClass', 'public class TestClass {}');

      expect(mockAuth.toolingRequest).toHaveBeenCalledWith('/sobjects/ApexClass/', {
        method: 'POST',
        body: JSON.stringify({
          Name: 'TestClass',
          Body: 'public class TestClass {}'
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateApexClass', () => {
    it('should update an apex class', async () => {
      mockAuth.toolingRequest.mockResolvedValue({});

      await client.updateApexClass('123', 'public class UpdatedTestClass {}');

      expect(mockAuth.toolingRequest).toHaveBeenCalledWith('/sobjects/ApexClass/123', {
        method: 'PATCH',
        body: JSON.stringify({ Body: 'public class UpdatedTestClass {}' }),
        headers: { 'Content-Type': 'application/json' }
      });
    });
  });

  describe('deleteApexClass', () => {
    it('should delete an apex class', async () => {
      mockAuth.toolingRequest.mockResolvedValue({});

      await client.deleteApexClass('123');

      expect(mockAuth.toolingRequest).toHaveBeenCalledWith('/sobjects/ApexClass/123', {
        method: 'DELETE'
      });
    });
  });

  describe('getCodeCoverage', () => {
    it('should get code coverage for all classes', async () => {
      const mockResponse = {
        records: [
          {
            ApexClassOrTriggerId: '123',
            ApexClassOrTriggerName: 'TestClass',
            NumLinesCovered: 10,
            NumLinesUncovered: 5,
            Coverage: { coveredLines: [1, 2, 3], uncoveredLines: [4, 5] }
          }
        ]
      };

      mockAuth.toolingRequest.mockResolvedValue(mockResponse);

      const result = await client.getCodeCoverage();

      expect(mockAuth.toolingRequest).toHaveBeenCalledWith('/query/?q=SELECT+ApexClassOrTriggerId%2C+ApexClassOrTrigger.Name%2C+NumLinesCovered%2C+NumLinesUncovered%2C+Coverage+FROM+ApexCodeCoverageAggregate');
      expect(result).toEqual(mockResponse.records);
    });

    it('should get code coverage for specific class', async () => {
      const mockResponse = {
        records: [
          {
            ApexClassOrTriggerId: '123',
            ApexClassOrTriggerName: 'TestClass',
            NumLinesCovered: 10,
            NumLinesUncovered: 5,
            Coverage: { coveredLines: [1, 2, 3], uncoveredLines: [4, 5] }
          }
        ]
      };

      mockAuth.toolingRequest.mockResolvedValue(mockResponse);

      const result = await client.getCodeCoverage('123');

      expect(mockAuth.toolingRequest).toHaveBeenCalledWith('/query/?q=SELECT+ApexClassOrTriggerId%2C+ApexClassOrTrigger.Name%2C+NumLinesCovered%2C+NumLinesUncovered%2C+Coverage+FROM+ApexCodeCoverageAggregate+WHERE+ApexClassOrTriggerId+%3D+%27123%27');
      expect(result).toEqual(mockResponse.records);
    });
  });

  describe('runTests', () => {
    it('should run tests', async () => {
      const mockResponse = { AsyncApexJobId: 'job123' };

      mockAuth.toolingRequest.mockResolvedValue(mockResponse);

      const result = await client.runTests(['class123', 'class456']);

      expect(mockAuth.toolingRequest).toHaveBeenCalledWith('runTestsAsynchronous/', {
        method: 'POST',
        body: JSON.stringify({
          tests: [{ classId: 'class123' }, { classId: 'class456' }],
          maxFailedTests: 1
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      expect(result).toEqual(mockResponse);
    });

    it('should run tests without class ids', async () => {
      const mockResponse = { AsyncApexJobId: 'job123' };

      mockAuth.toolingRequest.mockResolvedValue(mockResponse);

      const result = await client.runTests();

      expect(mockAuth.toolingRequest).toHaveBeenCalledWith('runTestsAsynchronous/', {
        method: 'POST',
        body: JSON.stringify({
          tests: [],
          maxFailedTests: 1
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getTestResults', () => {
    it('should get test results', async () => {
      const mockResponse = {
        records: [{
          Id: 'job123',
          Status: 'Completed',
          JobItemsProcessed: 5,
          TotalJobItems: 5,
          NumberOfErrors: 0
        }]
      };

      mockAuth.toolingRequest.mockResolvedValue(mockResponse);

      const result = await client.getTestResults('job123');

      expect(mockAuth.toolingRequest).toHaveBeenCalledWith('/query/?q=SELECT+Id%2C+Status%2C+JobItemsProcessed%2C+TotalJobItems%2C+NumberOfErrors+FROM+AsyncApexJob+WHERE+Id+%3D+%27job123%27');
      expect(result).toEqual(mockResponse.records[0]);
    });
  });

  describe('getAsyncApexJobs', () => {
    it('should get all async apex jobs', async () => {
      const mockResponse = {
        records: [{ Id: 'job123', Status: 'Completed' }]
      };

      mockAuth.toolingRequest.mockResolvedValue(mockResponse);

      const result = await client.getAsyncApexJobs();

      expect(mockAuth.toolingRequest).toHaveBeenCalledWith('/query/?q=SELECT+Id%2C+Status%2C+JobType%2C+MethodName%2C+JobItemsProcessed%2C+TotalJobItems%2C+NumberOfErrors%2C+CompletedDate%2C+CreatedDate%2C+CreatedBy.Name+FROM+AsyncApexJob+ORDER+BY+CreatedDate+DESC+LIMIT+100');
      expect(result).toEqual(mockResponse.records);
    });

    it('should get async apex jobs with status filter', async () => {
      const mockResponse = {
        records: [{ Id: 'job123', Status: 'Completed' }]
      };

      mockAuth.toolingRequest.mockResolvedValue(mockResponse);

      const result = await client.getAsyncApexJobs('Completed', 50);

      expect(mockAuth.toolingRequest).toHaveBeenCalledWith('/query/?q=SELECT+Id%2C+Status%2C+JobType%2C+MethodName%2C+JobItemsProcessed%2C+TotalJobItems%2C+NumberOfErrors%2C+CompletedDate%2C+CreatedDate%2C+CreatedBy.Name+FROM+AsyncApexJob+WHERE+Status+%3D+%27Completed%27+ORDER+BY+CreatedDate+DESC+LIMIT+50');
      expect(result).toEqual(mockResponse.records);
    });
  });

  describe('getAsyncApexJob', () => {
    it('should get a specific async apex job', async () => {
      const mockResponse = {
        records: [{ Id: 'job123', Status: 'Completed', ExtendedStatus: null }]
      };

      mockAuth.toolingRequest.mockResolvedValue(mockResponse);

      const result = await client.getAsyncApexJob('job123');

      expect(mockAuth.toolingRequest).toHaveBeenCalledWith('/query/?q=SELECT+Id%2C+Status%2C+JobType%2C+MethodName%2C+JobItemsProcessed%2C+TotalJobItems%2C+NumberOfErrors%2C+CompletedDate%2C+CreatedDate%2C+CreatedBy.Name%2C+ExtendedStatus+FROM+AsyncApexJob+WHERE+Id+%3D+%27job123%27');
      expect(result).toEqual(mockResponse.records[0]);
    });
  });

  describe('searchAsyncApexJobs', () => {
    it('should search async apex jobs with all filters', async () => {
      const mockResponse = {
        records: [{ Id: 'job123', Status: 'Completed', JobType: 'BatchApex' }]
      };

      mockAuth.toolingRequest.mockResolvedValue(mockResponse);

      const searchParams = {
        status: 'Completed',
        jobType: 'BatchApex',
        apexClassName: 'TestBatch',
        createdDateFrom: '2023-01-01T00:00:00Z',
        createdDateTo: '2023-12-31T23:59:59Z',
        limit: 50
      };

      const result = await client.searchAsyncApexJobs(searchParams);

      expect(mockAuth.toolingRequest).toHaveBeenCalledWith('/query/?q=SELECT+Id%2C+Status%2C+JobType%2C+MethodName%2C+JobItemsProcessed%2C+TotalJobItems%2C+NumberOfErrors%2C+CompletedDate%2C+CreatedDate%2C+CreatedBy.Name%2C+ApexClass.Name+FROM+AsyncApexJob+WHERE+Id+%21%3D+NULL+AND+Status+%3D+%27Completed%27+AND+JobType+%3D+%27BatchApex%27+AND+ApexClass.Name+LIKE+%27%25TestBatch%25%27+AND+CreatedDate+%3E%3D+2023-01-01T00%3A00%3A00Z+AND+CreatedDate+%3C%3D+2023-12-31T23%3A59%3A59Z+ORDER+BY+CreatedDate+DESC+LIMIT+50');
      expect(result).toEqual(mockResponse.records);
    });

    it('should search async apex jobs without filters', async () => {
      const mockResponse = {
        records: [{ Id: 'job123', Status: 'Completed' }]
      };

      mockAuth.toolingRequest.mockResolvedValue(mockResponse);

      const result = await client.searchAsyncApexJobs({});

      expect(mockAuth.toolingRequest).toHaveBeenCalledWith('/query/?q=SELECT+Id%2C+Status%2C+JobType%2C+MethodName%2C+JobItemsProcessed%2C+TotalJobItems%2C+NumberOfErrors%2C+CompletedDate%2C+CreatedDate%2C+CreatedBy.Name%2C+ApexClass.Name+FROM+AsyncApexJob+WHERE+Id+%21%3D+NULL+ORDER+BY+CreatedDate+DESC+LIMIT+100');
      expect(result).toEqual(mockResponse.records);
    });
  });
});
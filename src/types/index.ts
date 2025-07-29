export interface SalesforceConfig {
  instanceUrl: string;
  clientId: string;
  clientSecret?: string;
  username?: string;
  password?: string;
  securityToken?: string;
  privateKey?: string;
  subject?: string;
  apiVersion: string;
}

export interface SalesforceTokenResponse {
  access_token: string;
  instance_url: string;
  id: string;
  token_type: string;
  issued_at: string;
  signature: string;
}

export interface ToolingApiResponse<T = any> {
  totalSize: number;
  done: boolean;
  records: T[];
}

export interface ApexClass {
  Id: string;
  Name: string;
  Body: string;
  NamespacePrefix?: string;
  ApiVersion: number;
  Status: string;
  IsValid: boolean;
  BodyCrc: number;
  LengthWithoutComments: number;
  LastModifiedDate: string;
  CreatedDate: string;
}

export interface ApexTrigger {
  Id: string;
  Name: string;
  Body: string;
  TableEnumOrId: string;
  NamespacePrefix?: string;
  ApiVersion: number;
  Status: string;
  IsValid: boolean;
  BodyCrc: number;
  LengthWithoutComments: number;
  LastModifiedDate: string;
  CreatedDate: string;
}

export interface ApexPage {
  Id: string;
  Name: string;
  Markup: string;
  NamespacePrefix?: string;
  ApiVersion: number;
  MasterLabel: string;
  Description?: string;
  ControllerType: string;
  ControllerKey?: string;
  LastModifiedDate: string;
  CreatedDate: string;
}

export interface CodeCoverage {
  ApexClassOrTriggerId: string;
  ApexClassOrTriggerName: string;
  NumLinesCovered: number;
  NumLinesUncovered: number;
  Coverage: {
    coveredLines: number[];
    uncoveredLines: number[];
  };
}

export interface SymbolTable {
  Id: string;
  Name: string;
  SymbolTable: {
    constructors: any[];
    methods: any[];
    properties: any[];
    variables: any[];
    innerClasses: any[];
    interfaces: any[];
    externalReferences: any[];
  };
}
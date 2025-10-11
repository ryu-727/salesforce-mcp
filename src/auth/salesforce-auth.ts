import { AuthInfo, Connection } from '@salesforce/core';
import { SalesforceConfig } from '../types/index.js';

export class SalesforceAuth {
  private config: SalesforceConfig;
  private connection?: Connection;

  constructor(config: SalesforceConfig) {
    this.config = config;
  }

  // Static method to create a shared instance
  static createShared(config: SalesforceConfig): SalesforceAuth {
    return new SalesforceAuth(config);
  }

  async getAccessToken(): Promise<string> {
    const connection = await this.getConnectionInternal();
    const accessToken = connection.accessToken;
    if (!accessToken) {
      throw new Error('No access token available');
    }
    return accessToken;
  }

  getInstanceUrl(): string {
    if (this.connection) {
      return this.connection.instanceUrl;
    }
    return this.config.instanceUrl;
  }

  async getConnection(): Promise<Connection> {
    return await this.getConnectionInternal();
  }

  async toolingRequest(url: string, options?: any): Promise<any> {
    const connection = await this.getConnectionInternal();
    return await connection.tooling.request(url, options);
  }

  async restRequest(url: string, options?: any): Promise<any> {
    const connection = await this.getConnectionInternal();
    return await connection.request(url, options);
  }

  private async getConnectionInternal(): Promise<Connection> {
    // Use AuthInfo-based authentication
    await this.authenticateWithAuthInfo();

    if (!this.connection) {
      throw new Error('Failed to establish connection');
    }

    return this.connection;
  }


  private async authenticateWithAuthInfo(): Promise<void> {
    try {
      let targetAuthInfo: AuthInfo;

      if (this.config.targetOrg) {
        // Get all authorizations and find matching org by alias or username
        const allAuths = await AuthInfo.listAllAuthorizations();

        const matchingAuth = allAuths.find(auth =>
          auth.aliases?.includes(this.config.targetOrg!) ||
          auth.username === this.config.targetOrg
        );

        if (!matchingAuth) {
          throw new Error(`Org with alias or username '${this.config.targetOrg}' not found`);
        }

        targetAuthInfo = await AuthInfo.create({ username: matchingAuth.username });
      } else {
        // Use default org
        targetAuthInfo = await AuthInfo.create();
      }

      // Create connection using AuthInfo
      this.connection = await Connection.create({ authInfo: targetAuthInfo });

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to authenticate with AuthInfo: ${message}`);
    }
  }
}
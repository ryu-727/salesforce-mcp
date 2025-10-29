import { AuthInfo, Connection } from '@salesforce/core';
import { SalesforceConfig } from '../types/index.js';

export class SalesforceAuth {
  private config: SalesforceConfig;

  constructor(config: SalesforceConfig) {
    this.config = config;
  }

  // Static method to create a shared instance
  static createShared(config: SalesforceConfig): SalesforceAuth {
    return new SalesforceAuth(config);
  }

  async toolingRequest(url: string, options?: any): Promise<any> {
    const connection = await this.getConnection();
    return await connection.tooling.request(url, options);
  }

  async restRequest(url: string, options?: any): Promise<any> {
    const connection = await this.getConnection();
    return await connection.request(url, options);
  }

  private async getConnection(): Promise<Connection> {
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

      // Create connection and return directly without caching
      return await Connection.create({ authInfo: targetAuthInfo });

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to authenticate with AuthInfo: ${message}`);
    }
  }

}
import axios from 'axios';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { SalesforceConfig, SalesforceTokenResponse, SfOrgListResponse, SfOrgInfo } from '../types/index.js';

export class SalesforceAuth {
  private config: SalesforceConfig;
  private accessToken?: string;
  private instanceUrl?: string;
  private tokenExpiresAt?: number;

  constructor(config: SalesforceConfig) {
    this.config = config;
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    // Try SF CLI authentication first
    try {
      await this.authenticateWithSfCli();
      if (this.accessToken) {
        return this.accessToken;
      }
    } catch (error) {
      // SF CLI authentication failed, try other methods
    }

    // Fallback to existing authentication methods
    if (this.config.privateKey && this.config.subject) {
      await this.authenticateWithJWT();
    } else if (this.config.username && this.config.password) {
      await this.authenticateWithUsernamePassword();
    } else {
      throw new Error('Invalid authentication configuration. Provide either SF CLI authentication, JWT (privateKey, subject) or username/password credentials.');
    }

    if (!this.accessToken) {
      throw new Error('Failed to obtain access token');
    }

    return this.accessToken;
  }

  getInstanceUrl(): string {
    return this.instanceUrl || this.config.instanceUrl;
  }

  private async authenticateWithJWT(): Promise<void> {
    if (!this.config.privateKey || !this.config.subject) {
      throw new Error('JWT authentication requires privateKey and subject');
    }

    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: this.config.clientId,
      sub: this.config.subject,
      aud: this.config.instanceUrl,
      exp: now + 300 // 5 minutes
    };

    const token = this.createJWT(header, payload, this.config.privateKey);

    try {
      const response = await axios.post(
        `${this.config.instanceUrl}/services/oauth2/token`,
        new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: token
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const tokenData: SalesforceTokenResponse = response.data;
      this.accessToken = tokenData.access_token;
      this.instanceUrl = tokenData.instance_url;
      this.tokenExpiresAt = Date.now() + (3600 * 1000); // 1 hour

    } catch (error: any) {
      throw error;
    }
  }

  private async authenticateWithUsernamePassword(): Promise<void> {
    if (!this.config.username || !this.config.password) {
      throw new Error('Username/password authentication requires username and password');
    }

    const password = this.config.securityToken 
      ? this.config.password + this.config.securityToken
      : this.config.password;

    try {
      const requestData = {
        grant_type: 'password',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret || '',
        username: this.config.username,
        password: password
      };

      const response = await axios.post(
        `${this.config.instanceUrl}/services/oauth2/token`,
        new URLSearchParams(requestData),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const tokenData: SalesforceTokenResponse = response.data;
      this.accessToken = tokenData.access_token;
      this.instanceUrl = tokenData.instance_url;
      this.tokenExpiresAt = Date.now() + (3600 * 1000); // 1 hour

    } catch (error: any) {
      throw error;
    }
  }

  private createJWT(header: any, payload: any, privateKey: string): string {
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto
      .createSign('RSA-SHA256')
      .update(signatureInput)
      .sign(privateKey, 'base64url');

    return `${signatureInput}.${signature}`;
  }

  private async authenticateWithSfCli(): Promise<void> {
    try {
      // Get SF CLI org list
      const orgListOutput = execSync('sf org list --json', { encoding: 'utf-8' });
      const orgList: SfOrgListResponse = JSON.parse(orgListOutput);

      if (orgList.status !== 0) {
        throw new Error('Failed to get org list from SF CLI');
      }

      // Combine all org types for searching
      const allOrgs: SfOrgInfo[] = [
        ...orgList.result.nonScratchOrgs,
        ...orgList.result.devHubs,
        ...orgList.result.scratchOrgs,
        ...orgList.result.sandboxes,
        ...orgList.result.other
      ];

      if (allOrgs.length === 0) {
        throw new Error('No authenticated orgs found in SF CLI');
      }

      let targetOrg: SfOrgInfo | undefined;

      if (this.config.targetOrg) {
        // Find org by alias or username
        targetOrg = allOrgs.find(org => 
          org.alias === this.config.targetOrg || 
          org.username === this.config.targetOrg
        );

        if (!targetOrg) {
          throw new Error(`Org with alias or username '${this.config.targetOrg}' not found in SF CLI`);
        }
      } else {
        // Use default org
        targetOrg = allOrgs.find(org => org.isDefaultUsername === true);
        
        if (!targetOrg) {
          // If no default, use first connected org
          targetOrg = allOrgs.find(org => org.connectedStatus === 'Connected');
        }

        if (!targetOrg) {
          throw new Error('No default or connected org found in SF CLI');
        }
      }

      // Check if org is connected
      if (targetOrg.connectedStatus !== 'Connected') {
        throw new Error(`Org '${targetOrg.alias || targetOrg.username}' is not connected: ${targetOrg.connectedStatus}`);
      }

      // Use the access token from SF CLI
      this.accessToken = targetOrg.accessToken;
      this.instanceUrl = targetOrg.instanceUrl;
      // SF CLI tokens typically expire after a certain time, set reasonable expiry
      this.tokenExpiresAt = Date.now() + (3600 * 1000); // 1 hour

    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error('SF CLI is not installed or not available in PATH');
      }
      throw error;
    }
  }
}
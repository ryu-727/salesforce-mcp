import fs from 'fs';
import path from 'path';

/**
 * Logger utility for the Salesforce MCP server
 * Provides structured logging with file output and console output for debugging
 * Supports ERROR, INFO, and DEBUG log levels with timestamp formatting
 */
export class Logger {
  private logFile?: string;

  constructor(logFile?: string) {
    this.logFile = logFile;
    if (this.logFile) {
      // ログディレクトリを作成
      const logDir = path.dirname(this.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  private writeToFile(message: string): void {
    if (this.logFile) {
      fs.appendFileSync(this.logFile, message + '\n');
    }
  }

  error(message: string): void {
    const formatted = this.formatMessage('ERROR', message);
    console.error(formatted);
    this.writeToFile(formatted);
  }

  info(message: string): void {
    const formatted = this.formatMessage('INFO', message);
    console.error(formatted); // MCPでは stderr を使用
    this.writeToFile(formatted);
  }

  debug(message: string): void {
    const formatted = this.formatMessage('DEBUG', message);
    if (process.env.DEBUG) {
      console.error(formatted);
    }
    this.writeToFile(formatted);
  }
}

// シングルトンインスタンス
export const logger = new Logger(
  process.env.MCP_LOG_FILE || 
  path.join(process.env.HOME || '', '.cache/salesforce-mcp/server.log')
);
# Salesforce Tooling API MCP Server

A Model Context Protocol (MCP) server that provides comprehensive access to Salesforce Tooling API functionality through Claude and other compatible AI assistants.

## Features

### 🔧 Metadata Management
- **Apex Class Tools**: CRUD operations for Apex classes
- **Apex Trigger Tools**: CRUD operations for Apex triggers  
- **Visualforce Tools**: CRUD operations for Visualforce pages

### 🔍 Query & Search
- **SOQL Query Tools**: Execute Tooling API queries with SOQL
- **Metadata Search**: Search across different metadata types
- **Object Describe**: Get schema information for Tooling API objects

### 📊 Code Analysis & Quality
- **Code Coverage Tools**: Analyze test coverage for classes and triggers
- **Symbol Table Tools**: Analyze code structure, dependencies, and get completion suggestions
- **Performance Tools**: Analyze SOQL query performance

### 🐛 Development & Debugging
- **Debug Tools**: Access debug logs and heap dumps
- **Test Execution**: Run Apex tests and get results
- **Syntax Validation**: Validate Apex code syntax

### 🔒 Security & Governance
- **Security Tools**: Check Apex sharing declarations and permissions
- **Org Management**: Get organization information and available objects

## Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd salesforce-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Configuration

Configure your Salesforce connection using environment variables:

### SF CLI Authentication

The MCP server uses Salesforce CLI authentication. Make sure you have authenticated to your org using the Salesforce CLI:

```bash
# Use default authenticated org
npm run dev

# Specify a particular org by alias
export SF_TARGET_ORG="myorg"
npm run dev

# Or specify by username
export SF_TARGET_ORG="user@example.com"
npm run dev
```

**Prerequisites:**
- Install Salesforce CLI: https://developer.salesforce.com/tools/cli
- Authenticate to your org: `sf org login web`
- Verify authentication: `sf org list`

## Usage

### Running the MCP Server

```bash
# Development mode
npm run dev

# Production mode (after build)
./build/index.js
```

### VS Code Configuration

To use this MCP server with Claude for VS Code, create a `.vscode/mcp.json` file in your workspace:

**Option 1: Using SF CLI Authentication (Recommended)**
```json
{
  "mcpServers": {
    "salesforce": {
      "command": "node",
      "args": ["/path/to/salesforce-mcp/build/index.js"],
      "env": {
        "SF_TARGET_ORG": "myorg"
      }
    }
  }
}
```

**Option 2: Using JWT Authentication**
```json
{
  "mcpServers": {
    "salesforce": {
      "command": "node",
      "args": ["/path/to/salesforce-mcp/build/index.js"],
      "env": {
        "SF_INSTANCE_URL": "https://your-domain.my.salesforce.com",
        "SF_CLIENT_ID": "your_connected_app_client_id",
        "SF_PRIVATE_KEY": "-----BEGIN RSA PRIVATE KEY-----\nyour_private_key_content\n-----END RSA PRIVATE KEY-----",
        "SF_SUBJECT": "your_username@example.com",
        "SF_API_VERSION": "59.0"
      }
    }
  }
}
```

Replace `/path/to/salesforce-mcp` with the actual path to your project directory.

### Claude Code CLI Configuration

**Option 1: Using SF CLI Authentication (Recommended)**
```bash
claude mcp add salesforce-mcp -s project \
  -e SF_TARGET_ORG=myorg \
  -- /path/to/salesforce-mcp/build/index.js
```

**Option 2: Using JWT Authentication**
```bash
claude mcp add salesforce-mcp -s project \
  -e SF_INSTANCE_URL=https://your-domain.my.salesforce.com \
  -e SF_CLIENT_ID=your_connected_app_client_id \
  -e SF_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
your_private_key_content
-----END RSA PRIVATE KEY-----" \
  -e SF_SUBJECT=your_username@example.com \
  -e SF_API_VERSION=59.0 \
  -- /path/to/salesforce-mcp/build/index.js
```

### Available Tools

#### REST API Tools
- `search_async_apex_jobs` - Search AsyncApexJob records with filtering by status, job type, Apex class name, date range
- `get_async_apex_job` - Get detailed information about a specific AsyncApexJob by ID
- `call_rest_api` - Make generic REST API calls to Salesforce
- `get_org_limits` - Get organization limits information
- `get_sobjects_list` - Get list of all available SObjects
- `describe_sobject` - Describe a specific SObject schema

#### Apex Class Management
- `list_apex_classes` - List all Apex classes with optional filtering
- `get_apex_class` - Get detailed information about a specific Apex class
- `create_apex_class` - Create a new Apex class
- `update_apex_class` - Update an existing Apex class
- `delete_apex_class` - Delete an Apex class

#### Apex Trigger Management
- `list_apex_triggers` - List all Apex triggers
- `get_apex_trigger` - Get detailed information about a specific trigger
- `create_apex_trigger` - Create a new Apex trigger
- `update_apex_trigger` - Update an existing trigger
- `delete_apex_trigger` - Delete a trigger

#### Visualforce Page Management
- `list_apex_pages` - List all Visualforce pages
- `get_apex_page` - Get detailed information about a specific page
- `create_apex_page` - Create a new Visualforce page
- `update_apex_page` - Update an existing page
- `delete_apex_page` - Delete a page

#### Query & Analysis Tools
- `execute_tooling_query` - Execute SOQL queries against Tooling API
- `describe_tooling_object` - Get schema information for Tooling objects
- `search_metadata` - Search for metadata across different types
- `get_code_coverage` - Get code coverage information
- `get_org_coverage` - Get organization-wide coverage statistics
- `get_symbol_table` - Analyze code structure and symbols
- `analyze_dependencies` - Analyze code dependencies
- `get_completion_suggestions` - Get code completion suggestions

#### Development Tools
- `run_tests` - Execute Apex tests
- `get_test_results` - Get test execution results
- `get_debug_logs` - Retrieve debug logs
- `get_debug_log_body` - Get full debug log content
- `validate_syntax` - Validate Apex code syntax
- `check_apex_sharing` - Check Apex sharing declarations
- `analyze_soql_performance` - Analyze SOQL query performance
- `get_org_info` - Get organization information
- `list_sobjects` - List available SObjects

## Example Usage with Claude

Once the MCP server is running and connected to Claude, you can use natural language commands like:

- "Search for completed AsyncApexJob records for BatchProcessor class"
- "Get details of AsyncApexJob with ID 707XXXXXXXXXXXXXXX"
- "Find all failed batch jobs from the last week"
- "List all Apex classes that contain 'Account' in their name"
- "Show me the code coverage for all classes below 75%"
- "Get the symbol table for the AccountTriggerHandler class"
- "Create a new Apex class called TestUtils with basic utility methods"
- "Run all tests and show me the results"

## Development

### Project Structure
```
src/
├── auth/           # Salesforce authentication
├── client/         # Tooling API HTTP client
├── tools/          # MCP tool implementations
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── index.ts        # Main server entry point
```

### Available Scripts
- `npm run build` - Build the TypeScript project
- `npm run dev` - Run in development mode with hot reload
- `npm run watch` - Watch mode for TypeScript compilation
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

## Requirements

- Node.js 18+
- Valid Salesforce org with API access
- Connected App configured for authentication

## License

MIT License - see LICENSE file for details
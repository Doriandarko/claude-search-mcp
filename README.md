# Claude Web Search MCP Server

This MCP (Model Context Protocol) server provides web search capabilities using the Claude API. It allows LLMs to access up-to-date information from the web through a standardized interface.

## Features

- Web search tool using Claude's web search API
- Support for domain filtering (allowed and blocked domains)
- Configurable maximum results per search
- Automatic configuration from Claude Desktop config file

## Prerequisites

- Node.js 18 or higher
- An Anthropic API key with web search enabled
- Claude Desktop app for testing

## Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Doriandarko/claude-search-mcp.git
    cd claude-search-mcp
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Build the server:**
    ```bash
    npm run build
    ```
    This compiles the TypeScript code and makes the server executable.

4.  **Link the server for global access:**
    ```bash
    npm link
    ```
    This makes the `mcp-server-claude-search` command available system-wide, allowing the Claude Desktop app to find it.

## Running the Server with Claude Desktop App

Once the server is installed and linked, the Claude Desktop app can manage it automatically if configured correctly.

1.  **Configure Claude Desktop App:**
    Open your Claude Desktop app's MCP server configuration file (usually `claude_desktop_config.json`). Add or update the entry for this server:

    ```json
    {
      "mcpServers": {
        // ... other servers ...
        "claude-search": {
          "command": "mcp-server-claude-search",
          "env": {
            "ANTHROPIC_API_KEY": "YOUR_ANTHROPIC_API_KEY_HERE"
          }
        }
        // ... other servers ...
      }
    }
    ```
    Replace `"YOUR_ANTHROPIC_API_KEY_HERE"` with your actual Anthropic API key. The server will also attempt to read this key from `~/code/claude-search-mcp/claude_desktop_config.json` if the `env` variable is not set here, but it's good practice to define it per-server in the main config.

2.  **Launch Claude Desktop App:**
    Start (or restart) your Claude Desktop application. It should now be able to find and launch the `mcp-server-claude-search` when needed.

3.  **Use Web Search:**
    You can now use web search capabilities in your conversations with Claude.

## Manual Server Execution (for testing/development)

If you want to run the server manually for testing or development purposes (outside of the Claude Desktop app management):

-   **Using the globally linked command:**
    ```bash
    mcp-server-claude-search
    ```
-   **Directly with tsx (for development with auto-restart):**
    ```bash
    npm run dev
    ```
-   **Running the compiled code directly:**
    ```bash
    npm start
    ```

## Web Search Tool Parameters

The web search tool supports the following parameters when called by an LLM:

-   `query` (required): The search query string.
-   `maxResults` (optional): Maximum number of search results to return (default: 5).
-   `allowedDomains` (optional): Array of domains to include in search results (e.g., `["example.com", "wikipedia.org"]`).
-   `blockedDomains` (optional): Array of domains to exclude from search results.

## License

MIT 

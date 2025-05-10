#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { Anthropic } from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables as fallback
dotenv.config();

// Function to load the Claude Desktop config
function loadClaudeConfig() {
  try {
    const configPath = path.resolve(process.env.HOME || '', 'code', 'claude-search-mcp', 'claude_desktop_config.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.warn(`Warning: Could not load Claude Desktop config: ${(error as Error).message}`);
    console.warn('Falling back to environment variables');
    return null;
  }
}

// Get Anthropic API key from config or environment
const claudeConfig = loadClaudeConfig();
const anthropicApiKey = process.env.ANTHROPIC_API_KEY || '';

// Initialize the Anthropic client
const anthropic = new Anthropic({
  apiKey: anthropicApiKey,
});

// Define tool schema
const WEB_SEARCH_TOOL: Tool = {
  name: "web_search",
  description: "Search the web for real-time information about any topic. Use this tool when you need up-to-date information that might not be available in your training data, or when you need to verify current facts.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query to look up on the web"
      },
      maxResults: {
        type: "number",
        description: "Maximum number of search results to return (default: 5)"
      },
      allowedDomains: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Only include results from these domains"
      },
      blockedDomains: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Never include results from these domains"
      }
    },
    required: ["query"]
  }
};

// Create the server
const server = new Server(
  {
    name: "Claude Web Search",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {},
    }
  }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [WEB_SEARCH_TOOL]
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  try {
    const { name, arguments: args } = request.params;

    if (name !== "web_search") {
      throw new Error(`Unknown tool: ${name}`);
    }

    if (!args || typeof args !== 'object') {
      throw new Error("No arguments provided");
    }

    const { query, maxResults = 5, allowedDomains, blockedDomains } = args as any;

    if (!query || typeof query !== 'string') {
      throw new Error("Invalid query parameter");
    }

    // Prepare the web search tool configuration
    const webSearchTool = {
      type: "web_search_20250305",
      name: "web_search",
      max_uses: maxResults
    };

    // Add domain filtering if provided
    if (allowedDomains && Array.isArray(allowedDomains) && allowedDomains.length > 0) {
      (webSearchTool as any).allowed_domains = allowedDomains;
    }
    
    if (blockedDomains && Array.isArray(blockedDomains) && blockedDomains.length > 0) {
      (webSearchTool as any).blocked_domains = blockedDomains;
    }

    // Create a Claude message with the web search
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-latest",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: query
        }
      ],
      // @ts-ignore - Ignoring TypeScript error since Claude API does support this
      tools: [webSearchTool]
    });

    // Extract and format the search results
    let results = "";
    
    for (const item of response.content) {
      if (item.type === 'text') {
        results += item.text + "\n\n";
      } else if (item.type === 'web_search_tool_result' && 'content' in item && Array.isArray(item.content)) {
        results += "### Search Results\n\n";
        for (const result of item.content) {
          if (result.type === 'web_search_result') {
            results += `- [${result.title}](${result.url})\n`;
            results += `  Last updated: ${result.page_age || 'Unknown'}\n\n`;
          }
        }
      }
    }

    // Return the formatted results
    return {
      content: [{ type: "text", text: results.trim() }]
    };
  } catch (error) {
    console.error('Error performing web search:', error);
    return {
      content: [{ type: "text", text: `Error performing web search: ${(error as Error).message}` }],
      isError: true
    };
  }
});

// Run the server via stdio
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Claude Web Search MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
}); 
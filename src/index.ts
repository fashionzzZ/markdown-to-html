import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { themes } from './theme/theme.js';
import { renderMarkdown } from './utils/render.js';
import { DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE } from './config/config.js';


class MarkdownToHtml {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "markdown-to-html",
        version: "0.1.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );


    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers(): void {
    this.setupResourceHandlers();
    this.setupToolHandlers();
  }

  private setupResourceHandlers(): void {
    // TODO: 实现资源处理器
  }

  private setupToolHandlers(): void {
    // TODO: 实现工具处理器
    this.server.setRequestHandler(
      ListToolsRequestSchema,
      async () => ({
        tools: [{
          name: "markdown_to_html",
          description: "Convert Markdown to HTML",
          inputSchema: {
            type: "object",
            properties: {
              mdContent: {
                type: "string",
                description: "Markdown content to convert",
              }
            },
            required: ["mdContent"]
          }
        }]
      })
    );

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request) => {
        if (request.params.name !== "markdown_to_html") {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
        }

        if (!request.params.arguments) {
          throw new McpError(ErrorCode.InvalidParams, "Missing request arguments");
        }

        const mdContent = request.params.arguments.mdContent;

        if (typeof mdContent !== 'string') {
          throw new McpError(ErrorCode.InvalidParams, "mdContent must be a string");
        }

        try {
          const htmlContent = renderMarkdown(mdContent, themes.grace, DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE);
          
          return {
            content: [{
              type: "text",
              text: htmlContent
            }]
          };
        } catch (error) {
          throw error;
        }
      }
    );
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error("MarkdownToHtml MCP server running on stdio");
  }
}

const server = new MarkdownToHtml();
server.run().catch(console.error);

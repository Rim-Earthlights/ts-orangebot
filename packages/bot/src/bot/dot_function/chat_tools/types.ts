import { Message } from 'discord.js';
import { ChatCompletionTool } from 'openai/resources/index.js';

export type ToolContext = {
  message: Message;
  authorId: string;
  guildId?: string;
};

export type Tool = {
  definition: ChatCompletionTool;
  handler: (args: Record<string, unknown>, ctx: ToolContext) => Promise<string>;
};

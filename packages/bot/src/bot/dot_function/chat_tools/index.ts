import { Tool } from './types.js';
import { userActivityTool } from './userActivity.js';
import { weatherTool } from './weather.js';

export type { Tool, ToolContext } from './types.js';

export const toolRegistry: Tool[] = [weatherTool, userActivityTool];

export function findTool(name: string): Tool | undefined {
  return toolRegistry.find((t) => t.definition.type === 'function' && t.definition.function.name === name);
}

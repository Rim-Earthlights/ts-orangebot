import { Tool } from './types.js';
import { botCommandsTool } from './commands.js';
import { userActivityTool } from './userActivity.js';
import { weatherByCoordinatesTool } from './weatherByCoordinates.js';
import { weatherTool } from './weather.js';

export type { Tool, ToolContext } from './types.js';

export const toolRegistry: Tool[] = [weatherTool, weatherByCoordinatesTool, userActivityTool, botCommandsTool];

export function findTool(name: string): Tool | undefined {
  return toolRegistry.find((t) => t.definition.type === 'function' && t.definition.function.name === name);
}

import * as Forecast from '../forecast.js';
import { Tool } from './types.js';

function parseNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function parseDay(value: unknown): number {
  if (value === undefined || value === null) {
    return 0;
  }

  const parsed = parseNumber(value);
  if (parsed === undefined || !Number.isInteger(parsed)) {
    throw new Error('day must be an integer');
  }

  return parsed;
}

export const weatherByCoordinatesTool: Tool = {
  definition: {
    type: 'function',
    function: {
      name: 'get_weather_by_coordinates',
      description:
        '緯度経度を指定して天気予報を取得します。海外など、都市名や日本の登録地域では場所を特定しにくい場合に使用してください。',
      parameters: {
        type: 'object',
        properties: {
          latitude: {
            type: 'number',
            description: '緯度。-90 から 90 の範囲で指定します。例: 40.7128',
            minimum: -90,
            maximum: 90,
          },
          longitude: {
            type: 'number',
            description: '経度。-180 から 180 の範囲で指定します。例: -74.0060',
            minimum: -180,
            maximum: 180,
          },
          day: {
            type: 'integer',
            description: '何日後の予報か。0=今日, 1=明日, 最大6まで。',
            minimum: 0,
            maximum: 6,
          },
          location_name: {
            type: 'string',
            description: '表示用の任意の地名。例: New York, London, Paris',
          },
        },
        required: ['latitude', 'longitude'],
      },
    },
  },
  handler: async (args, ctx) => {
    try {
      const latitude = parseNumber(args.latitude);
      const longitude = parseNumber(args.longitude);
      const day = parseDay(args.day);
      const locationName = typeof args.location_name === 'string' ? args.location_name : undefined;

      if (latitude === undefined) {
        return JSON.stringify({ error: 'latitude is required and must be a number' });
      }
      if (longitude === undefined) {
        return JSON.stringify({ error: 'longitude is required and must be a number' });
      }

      const result = await Forecast.weatherJsonByCoordinates(ctx.message, latitude, longitude, day, locationName);
      return JSON.stringify(result);
    } catch (e) {
      return JSON.stringify({ error: (e as Error).message });
    }
  },
};

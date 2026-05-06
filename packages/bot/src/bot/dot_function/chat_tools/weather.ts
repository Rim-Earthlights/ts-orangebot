import * as Forecast from '../forecast.js';
import { Tool } from './types.js';

export const weatherTool: Tool = {
  definition: {
    type: 'function',
    function: {
      name: 'get_weather',
      description:
        '指定した地域の天気予報を取得します。地域が指定されていない場合は、ユーザーが登録している地域の天気を取得します。',
      parameters: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: '都市名 (例: 東京, 大阪, New York)。省略時はユーザー登録地を使用します。',
          },
          day: {
            type: 'integer',
            description: '何日後の予報か。0=今日, 1=明日, 最大6まで。',
            minimum: 0,
            maximum: 6,
          },
        },
        required: [],
      },
    },
  },
  handler: async (args, ctx) => {
    const day = typeof args.day === 'number' ? args.day : 0;
    let city = typeof args.city === 'string' ? args.city : undefined;

    if (!city) {
      const pref = await Forecast.getPref(ctx.authorId);
      if (!pref) {
        return JSON.stringify({
          error: 'weather not registered, please run `.reg pref [pref_name]`',
        });
      }
      city = pref;
    }

    const result = await Forecast.weatherJson(ctx.message, [city, String(day)]);
    if (!result) {
      return JSON.stringify({ error: 'failed to fetch weather' });
    }
    return JSON.stringify(result);
  },
};

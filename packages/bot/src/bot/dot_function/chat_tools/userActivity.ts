import { ActivityType } from 'discord.js';
import { DISCORD_CLIENT } from '../../../constant/constants.js';
import { UsersRepository } from "@orangebot/shared";
import { Tool } from './types.js';

const FALLBACK_GUILD_ID = '1017341244508225596';

export const userActivityTool: Tool = {
  definition: {
    type: 'function',
    function: {
      name: 'get_user_activity',
      description:
        'Discordユーザの現在のアクティビティ(プレイ中のゲーム、視聴中の動画、Spotifyなど)を取得します。「今何してる？」のような質問や、ユーザの状況を踏まえた応答が必要なときに使用してください。',
      parameters: {
        type: 'object',
        properties: {
          user_id: {
            type: 'string',
            description: 'DiscordユーザID または `<@id>` 形式のメンション文字列',
          },
        },
        required: ['user_id'],
      },
    },
  },
  handler: async (args, ctx) => {
    const raw = typeof args.user_id === 'string' ? args.user_id : '';
    const userId = raw.replace(/[<@!>]/g, '');
    if (!userId) {
      return JSON.stringify({ error: 'user_id is required' });
    }

    let guildId = ctx.guildId;
    if (!guildId) {
      const userRepo = new UsersRepository();
      const userInfo = await userRepo.getByUid(ctx.authorId);
      guildId = userInfo?.guild_id ?? FALLBACK_GUILD_ID;
    }

    const presence = DISCORD_CLIENT.guilds.cache.get(guildId)?.presences.cache.get(userId);
    if (!presence || presence.activities.length === 0) {
      return JSON.stringify({ user_id: userId, activities: [] });
    }
    return JSON.stringify({
      user_id: userId,
      activities: presence.activities.map((a) => ({
        type: ActivityType[a.type],
        name: a.name,
        details: a.details,
        state: a.state,
      })),
    });
  },
};

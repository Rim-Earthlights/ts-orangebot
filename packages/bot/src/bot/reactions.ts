import { ChannelType, MessageReaction, PartialMessageReaction, PartialUser, TextChannel, User } from 'discord.js';
import { Logger } from '../common/logger.js';
import { LogLevel } from '@orangebot/shared';
import { GAME_SELECT_TITLE, getPlayingGame, setVoiceChannelStatus } from './utils/gameSelect.js';
import { acceptMember } from './utils/memberAccept.js';

/**
 * リアクション時の処理を行う
 * @param reaction
 * @param user
 * @returns
 */
export const reactionSelector = async (
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser
) => {
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Something went wrong when fetching the message:', error);
      return;
    }
  }

  if (user.partial) {
    try {
      await user.fetch();
    } catch (error) {
      console.error('Something went wrong when fetching the message:', error);
      return;
    }
  }

  if (user.bot) return;

  const embed = reaction.message.embeds.find((e) => e.title);
  if (!embed) return;

  switch (embed.title) {
    case 'ルールを読んだ': {
      if (reaction.message.channel.type === ChannelType.GuildText) {
        await reaction.users.remove(user.id);

        if (!reaction.message.guild) {
          return;
        }
        // adminに送信
        const channel = (await reaction.message.guild.channels.fetch('1239718107073875978')) as TextChannel;
        if (!channel) {
          return;
        }
        await channel.send(`rule accepted: ${user.displayName}`);

        await Logger.put({
          guild_id: reaction.message.guild?.id,
          channel_id: reaction.message.channel.id,
          user_id: user.id,
          level: LogLevel.INFO,
          event: 'reaction-add',
          message: [`rule accepted: ${user.displayName}`],
        });

        const u = reaction.message.guild.members.cache.get(user.id);

        if (!u) {
          console.error('user not found');
          return;
        }

        const result = await acceptMember(u, reaction.message.channel.id);
        if (result === 'role-not-found') {
          return;
        }
        if (result === 'already-member') {
          const message = await reaction.message.reply(`もうロールが付いてるみたい！`);
          setTimeout(async () => {
            await message.delete();
          }, 3000);
          return;
        }

        const message = await reaction.message.reply(`読んでくれてありがと～！ロールを付与したよ！`);
        setTimeout(async () => {
          await message.delete();
        }, 3000);
        return;
      }
      break;
    }
    case GAME_SELECT_TITLE: {
      const channel = reaction.message.channel;
      const guild = reaction.message.guild;
      if (channel.type !== ChannelType.GuildVoice || !guild) {
        break;
      }

      await reaction.users.remove(user.id);

      // 押した人のアクティビティからゲーム名を取得する
      const game = getPlayingGame(guild, user.id);
      if (!game) {
        await Logger.put({
          guild_id: guild.id,
          channel_id: channel.id,
          user_id: user.id,
          level: LogLevel.INFO,
          event: 'game-select',
          message: [`activity not found: ${user.displayName}`],
        });
        await replyTemporary(reaction, 'プレイ中のゲームが見つからなかったよ…！');
        break;
      }

      try {
        // await channel.setName(game);
        await setVoiceChannelStatus(channel.id, game);
      } catch (e) {
        const err = e as Error;
        await Logger.put({
          guild_id: guild.id,
          channel_id: channel.id,
          user_id: user.id,
          level: LogLevel.ERROR,
          event: 'game-select',
          message: [`set voice status failed: ${game}`, err.message],
        });
        await replyTemporary(reaction, 'ステータスの設定に失敗しちゃった…！');
        break;
      }

      await Logger.put({
        guild_id: guild.id,
        channel_id: channel.id,
        user_id: user.id,
        level: LogLevel.INFO,
        event: 'game-select',
        message: [`set voice status: ${user.displayName} | ${game}`],
      });
      await replyTemporary(reaction, `ステータスを「${game}」に変更したよ！`);
      break;
    }
  }
};

/**
 * リアクション元のメッセージに一時的な返信を行う
 * @param reaction リアクション
 * @param content 返信内容
 */
const replyTemporary = async (reaction: MessageReaction | PartialMessageReaction, content: string) => {
  const message = await reaction.message.reply(content);
  setTimeout(async () => {
    await message.delete().catch(() => undefined);
  }, 5000);
};

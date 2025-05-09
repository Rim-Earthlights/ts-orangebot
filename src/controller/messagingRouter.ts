import Express from 'express';
import { TextChannel } from 'discord.js';
import { DISCORD_CLIENT } from '../constant/constants.js';
import { Logger } from '../common/logger.js';
import { LogLevel } from '../type/types.js';

export const messagingRouter = Express.Router();

/**
 * /message POST
 * botへ直接メッセージを送信させる
 *
 * @param req.body.channel 指定チャンネルID
 * @param req.body.user User ID
 * @param req.body.message 送信メッセージ
 */
messagingRouter.post('/message', async (req: Express.Request, res: Express.Response) => {
  if (!req.body.channel && !req.body.user) {
    res.status(500).send({ result: false, message: 'user or channel is required.' });
    return;
  }
  if (!req.body.message) {
    res.status(500).send({ result: false, message: 'message is required.' });
    return;
  }

  if (req.body.channel) {
    const channel = DISCORD_CLIENT.channels.cache.get(req.body.channel) as TextChannel | undefined;

    if (!channel) {
      res.status(500).send({ result: false, message: 'can not get channel.' });
      return;
    }
    Logger.put({
      guild_id: channel.guild?.id,
      channel_id: channel.id,
      user_id: undefined,
      level: LogLevel.INFO,
      event: 'POST /message',
      message: [`ip: ${req.ip}`, `message: ${req.body.message}`],
    });
    await channel.send(req.body.message);
  }

  if (req.body.user) {
    const user = await DISCORD_CLIENT.users.fetch(req.body.user);
    if (!user) {
      res.status(500).send({ result: false, message: 'can not get user.' });
      return;
    }
    Logger.put({
      guild_id: undefined,
      channel_id: user.dmChannel?.id,
      user_id: user.id,
      level: LogLevel.INFO,
      event: 'POST /message',
      message: [`ip: ${req.ip}`, `message: ${req.body.message}`],
    });
    await user.send(req.body.message);
  }

  res.status(200).send({ result: true });
});

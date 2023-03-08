import Express from 'express';
import { TextChannel } from 'discord.js';
import { DISCORD_CLIENT } from '../constant/constants.js';
import dayjs from 'dayjs';

export const messagingRouter = Express.Router();

/**
 * /message POST
 * botへ直接メッセージを送信させる
 *
 * @param req.body.channel 指定チャンネルID
 * @param req.body.message 送信メッセージ
 */
messagingRouter.post('/message', (req: Express.Request, res: Express.Response) => {
    console.log('==================================================');
    console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] POST | /message`);

    const channel = DISCORD_CLIENT.channels.cache.get(req.body.channel) as TextChannel | undefined;
    console.log(` * ip     : ${req.ip}`);
    console.log(` * channel: ${channel?.guild.name}/${channel?.name} (${channel?.id})`);
    console.log(` * message: ${req.body.message}`);
    console.log('==================================================');

    if (channel == undefined) {
        res.status(500).send({ result: false, message: 'can not get channel.' });
        return;
    }

    channel.send(req.body.message);
    res.status(200).send({ result: true });
});

import Express from 'express';
import { TextChannel } from 'discord.js';
import { DISCORD_CLIENT } from '../constant/constants';

export const messagingRouter = Express.Router();

messagingRouter.post('/message', (req: Express.Request, res: Express.Response) => {
    console.log('> Send Chat');
    console.log(`  * channel: ${req.body.channel}`);
    console.log(`  * message: ${req.body.message}`);
    console.log();

    const channel = DISCORD_CLIENT.channels.cache.get(req.body.channel) as TextChannel | undefined;
    if (channel == undefined) {
        res.status(500).send({ result: false, message: 'can not get channel.' });
        return;
    }

    channel.send(req.body.message);
    res.status(200).send({ result: true });
});

import axios from 'axios';
import Express from 'express';
import { CONFIG } from '../config/config.js';
import { CHATBOT_TEMPLATE } from '../constant/constants.js';
import { localOnly } from './middleware/localOnly.js';

export const sessionRouter = Express.Router();

/**
 * /session POST
 * OpenAI用のtokenを取得する
 * サーバーの API キーでセッションを発行する (費用が発生する) ため、同じマシン上からのリクエストに限定する
 */
sessionRouter.get('/session', localOnly, async (req: Express.Request, res: Express.Response) => {
  const token = await getOpenAIToken();
  res.status(200).send({ token });
});

/**
 * セッションを作成し、キーを取得する
 */
export async function getOpenAIToken() {
  const response = await axios.post('https://api.openai.com/v1/realtime/sessions', {
    model: "gpt-4o-mini-realtime-preview-2024-12-17",
    object: "realtime.session",
    modalities: ["audio"],
    voice: "coral",
    input_audio_format: "pcm16",
    output_audio_format: "pcm16",
    instructions: CHATBOT_TEMPLATE,
    turn_detection: null,
  },
    {
      headers: {
        'Authorization': `Bearer ${CONFIG.LITELLM.KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
}

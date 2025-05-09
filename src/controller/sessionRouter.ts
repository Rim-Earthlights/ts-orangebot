import axios from 'axios';
import Express from 'express';
import { CONFIG } from '../config/config.js';
import { CHATBOT_TEMPLATE } from '../constant/constants.js';

export const sessionRouter = Express.Router();

/**
 * /session POST
 * OpenAI用のtokenを取得する
 */
sessionRouter.get('/session', async (req: Express.Request, res: Express.Response) => {
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
        'Authorization': `Bearer ${CONFIG.OPENAI.KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
}

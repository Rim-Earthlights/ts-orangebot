import axios from 'axios';
import Express from 'express';
import { CoeiroSpeakersResponse, SpeakersResponse } from '../interface/voicevox/voicevoxResponse';
export const speakerRouter = Express.Router();

/**
 * / GET
 * とりあえずjson返す
 */
speakerRouter.get('/speakers', async (req: Express.Request, res: Express.Response) => {
  const { data: v } = (await axios.get('http://127.0.0.1:50021/speakers')) as { data: SpeakersResponse[] };
  const { data: c } = (await axios.get('http://127.0.0.1:50032/v1/speakers')) as { data: CoeiroSpeakersResponse[] };

  const vSpeakers = v.map((vb) => {
    return {
      name: vb.name,
      styles: vb.styles.map((vs) => {
        return {
          name: vs.name,
          id: vs.id,
        };
      }),
    };
  });
  const cSpeakers = c.map((cb) => {
    return {
      name: cb.speakerName,
      styles: cb.styles.map((cs) => {
        return {
          name: cs.styleName,
          id: cs.styleId + 1000,
        };
      }),
    };
  });

  const data = [...vSpeakers, ...cSpeakers];

  res.render('./speaker.ejs', { speakers: data });
});

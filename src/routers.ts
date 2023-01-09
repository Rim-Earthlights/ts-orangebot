import { gachaRouter } from './controller/gachaRouter';
import { indexRouter } from './controller/indexRouter';
import { speakerRouter } from './controller/speakerRouter';
import { messagingRouter } from './controller/messagingRouter';
import { musicRouter } from './controller/musicRouter';

export const routers = [indexRouter, messagingRouter, gachaRouter, musicRouter, speakerRouter];

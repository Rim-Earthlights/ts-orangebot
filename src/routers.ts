import { gachaRouter } from './controller/gachaRouter.js';
import { indexRouter } from './controller/indexRouter.js';
import { speakerRouter } from './controller/speakerRouter.js';
import { messagingRouter } from './controller/messagingRouter.js';
import { musicRouter } from './controller/musicRouter.js';

export const routers = [indexRouter, messagingRouter, gachaRouter, musicRouter, speakerRouter];

import { chatRouter } from './controller/chatRouter.js';
import { gachaRouter } from './controller/gachaRouter.js';
import { indexRouter } from './controller/indexRouter.js';
import { messagingRouter } from './controller/messagingRouter.js';
import { musicRouter } from './controller/musicRouter.js';
import { sessionRouter } from './controller/sessionRouter.js';
import { speakerRouter } from './controller/speakerRouter.js';

export const routers = [indexRouter, messagingRouter, gachaRouter, musicRouter, speakerRouter, sessionRouter, chatRouter];

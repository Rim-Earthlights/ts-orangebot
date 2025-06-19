import { Logger } from '../../common/logger.js';

/**
 * ハンドラーの基底クラス
 * loggerの初期化を統一する
 */
export abstract class BaseHandler {
  protected readonly logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new Logger();
  }
}
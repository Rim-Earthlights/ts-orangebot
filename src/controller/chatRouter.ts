import Express from 'express';
import { Logger } from '../common/logger.js';
import { ChatHistoryRepository } from '../model/repository/chatHistoryRepository.js';

export const chatRouter = Express.Router();

/**
 * /chat/history GET
 * チャット履歴一覧を取得する
 */
chatRouter.get('/chat/history', async (req: Express.Request, res: Express.Response) => {
  const logger = new Logger();
  const chatHistoryRepository = new ChatHistoryRepository();

  await logger.info('GET /chat/history', [`channelId: ${req.query.channel_id || 'all'}`]);

  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const channelId = req.query.channel_id as string;

    // channel_idが必須（ただし、'all'の場合は全件取得を許可）
    if (!channelId && req.query.channel_id !== 'all') {
      res.status(400).send({ result: false, message: 'channel_id is required.' });
      return;
    }

    const chatHistories = await chatHistoryRepository.getAll(limit, offset, channelId);

    // 特定のIDの場合は「全てのチャットを表示」ボタンを表示
    const showAllChatsButton = channelId === '986081825233469470';

    res.render('chatHistoryList', {
      chatHistories,
      limit,
      offset,
      channelId,
      showAllChatsButton,
      isAll: channelId === 'all',
    });
  } catch (error) {
    await logger.error('GET /chat/history', [`error: ${error}`]);
    res.status(500).send({ result: false, message: 'Internal server error.' });
  }
});

/**
 * /chat/history/:uuid GET
 * UUIDを指定してチャット履歴を取得する
 */
chatRouter.get('/chat/history/:uuid', async (req: Express.Request, res: Express.Response) => {
  const logger = new Logger();
  const chatHistoryRepository = new ChatHistoryRepository();

  await logger.info('GET /chat/history/:uuid', [`uuid: ${req.params.uuid}`]);

  try {
    const uuid = req.params.uuid;
    if (!uuid) {
      res.status(400).send({ result: false, message: 'UUID is required.' });
      return;
    }

    const chatHistory = await chatHistoryRepository.get(uuid);
    if (!chatHistory) {
      res.status(404).send({ result: false, message: 'Chat history not found.' });
      return;
    }

    res.render('chatHistory', {
      chatHistory: {
        ...chatHistory,
        content: chatHistory.content.slice(1),
      }
    });
  } catch (error) {
    await logger.error('GET /chat/history/:uuid', [`error: ${error}`]);
    res.status(500).send({ result: false, message: 'Internal server error.' });
  }
});

/**
 * /chat/history/:uuid DELETE
 * チャット履歴を削除する（ソフトデリート）
 */
chatRouter.delete('/chat/history/:uuid', async (req: Express.Request, res: Express.Response) => {
  const logger = new Logger();
  const chatHistoryRepository = new ChatHistoryRepository();

  await logger.info('DELETE /chat/history/:uuid', [`uuid: ${req.params.uuid}`]);

  try {
    const uuid = req.params.uuid;
    if (!uuid) {
      res.status(400).send({ result: false, message: 'UUID is required.' });
      return;
    }

    // 履歴が存在するかチェック
    const chatHistory = await chatHistoryRepository.get(uuid);
    if (!chatHistory) {
      res.status(404).send({ result: false, message: 'Chat history not found.' });
      return;
    }

    // ソフトデリート実行
    await chatHistoryRepository.delete(uuid);

    await logger.info('DELETE /chat/history/:uuid success', [`uuid: ${uuid}`]);
    res.status(200).send({ result: true, message: 'Chat history deleted successfully.' });
  } catch (error) {
    await logger.error('DELETE /chat/history/:uuid', [`error: ${error}`]);
    res.status(500).send({ result: false, message: 'Internal server error.' });
  }
});

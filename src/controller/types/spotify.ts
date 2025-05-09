import Express from 'express';

export interface CallbackRequest extends Express.Request {
  query: {
    code: string;
    state: string;
  };
}

export type CallbackResponse = Express.Response<{ result: string }>;

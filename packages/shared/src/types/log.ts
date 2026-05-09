export type LogData = {
  guild_id?: string;
  channel_id?: string;
  user_id?: string;
  level: LogLevel;
  event: string;
  message?: string[];
};

export enum LogLevel {
  INFO = 'info',
  ERROR = 'error',
  SYSTEM = 'system',
  DEBUG = 'debug',
}

export interface LoggerPort {
  put(data: LogData): Promise<void>;
}

const noopLogger: LoggerPort = {
  async put(data: LogData): Promise<void> {
    if (data.level === LogLevel.ERROR) {
      console.error(`[${data.level}] ${data.event}`, data.message ?? '');
    }
  },
};

let activeLogger: LoggerPort = noopLogger;

export function setLogger(logger: LoggerPort): void {
  activeLogger = logger;
}

export function getLogger(): LoggerPort {
  return activeLogger;
}

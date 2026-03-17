import { env } from '../config/env';

export const logger = {
  info: (message: string, ...args: any[]) => {
    if (['info', 'debug'].includes(env.LOG_LEVEL.toLowerCase())) {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (env.LOG_LEVEL.toLowerCase() === 'debug') {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
    }
  }
};

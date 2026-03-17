import { env } from './config/env';
import { logger } from './utils/logger';
import { initDb } from './db/schema';
import { bot } from './bot';
import { setupHandlers } from './bot/handlers';

const start = async () => {
  try {
    // 1. Initialize DB
    initDb();
    
    // 2. Setup message handlers
    setupHandlers(bot);

    // 3. Start Bot
    bot.launch();
    logger.info(`Bot started in ${env.NODE_ENV} mode.`);

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
};

start();

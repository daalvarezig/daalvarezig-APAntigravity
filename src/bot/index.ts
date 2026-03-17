import { Telegraf } from 'telegraf';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { setupCommands } from './commands';

export const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN as string);

// Authorization Middleware
bot.use(async (ctx, next) => {
  const userId = ctx.from?.id;
  if (!userId) {
    logger.warn('Received update without user ID');
    return;
  }

  if (env.TELEGRAM_ALLOWED_USER_IDS.length > 0 && !env.TELEGRAM_ALLOWED_USER_IDS.includes(userId)) {
    logger.warn(`Unauthorized access attempt from user ID: ${userId}`);
    await ctx.reply('Unauthorized. You are not allowed to use this bot.');
    return;
  }

  return next();
});

// Setup commands
setupCommands(bot);

// Error handling
bot.catch((err, ctx) => {
  logger.error(`Error for ${ctx.updateType}`, err);
});

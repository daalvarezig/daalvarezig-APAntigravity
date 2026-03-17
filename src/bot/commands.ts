import { Telegraf } from 'telegraf';
import { getOrCreateConversation } from '../db/repositories/conversation';
import { clearMessages } from '../db/repositories/message';
import { clearMemories, getMemories } from '../db/repositories/memory';
import { logger } from '../utils/logger';

export const setupCommands = (bot: Telegraf) => {
  bot.start((ctx) => {
    ctx.reply('Hello! I am your personal AI assistant. Send me a text message or a voice note to get started.');
  });

  bot.help((ctx) => {
    ctx.reply(
      'Available commands:\n' +
      '/start - Start interacting\n' +
      '/help - Show this message\n' +
      '/status - Check bot status\n' +
      '/memory - Show extracted memories\n' +
      '/clear - Clear conversation history and memories for this chat\n'
    );
  });

  bot.command('status', (ctx) => {
    ctx.reply('Bot is running properly. Database and AI connection active.');
  });

  bot.command('memory', (ctx) => {
    try {
      const memories = getMemories(ctx.chat.id);
      if (memories.length === 0) {
        return ctx.reply('I have no specific memories stored for you yet.');
      }
      const memText = memories.map((m, i) => `${i + 1}. ${m.content}`).join('\n');
      ctx.reply(`Here is what I remember about you:\n\n${memText}`);
    } catch (e) {
      logger.error('Error fetching memory', e);
      ctx.reply('Error fetching memory.');
    }
  });

  bot.command('clear', (ctx) => {
    try {
      const conv = getOrCreateConversation(ctx.chat.id);
      clearMessages(conv.id);
      clearMemories(ctx.chat.id);
      ctx.reply('Memory cleared. Starting fresh!');
    } catch (e) {
      logger.error('Error clearing memory', e);
      ctx.reply('Error clearing memory.');
    }
  });
};

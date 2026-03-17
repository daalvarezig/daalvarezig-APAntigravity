import { Telegraf } from 'telegraf';
import { processTelegramAudio } from '../services/audio';
import { manageMemoryAndContext } from '../services/memory';
import { logger } from '../utils/logger';
import { message } from 'telegraf/filters';

export const setupHandlers = (bot: Telegraf) => {
  bot.on(message('text'), async (ctx) => {
    try {
      if (ctx.message.text.startsWith('/')) return; // ignore commands here
      
      await ctx.sendChatAction('typing');
      const response = await manageMemoryAndContext(ctx.chat.id, ctx.message.text);
      await ctx.reply(response);
    } catch (error) {
      logger.error('Error handling text message', error);
      await ctx.reply('Sorry, I encountered an error processing your message.');
    }
  });

  bot.on([message('voice'), message('audio')], async (ctx) => {
    try {
      await ctx.sendChatAction('typing');
      
      const fileId = 'voice' in ctx.message ? ctx.message.voice.file_id : ctx.message.audio.file_id;
      const fileLink = await ctx.telegram.getFileLink(fileId);
      
      const text = await processTelegramAudio(fileLink);
      await ctx.reply(`_Transcribed:_ ${text}`, { parse_mode: 'Markdown' });
      
      await ctx.sendChatAction('typing');
      const response = await manageMemoryAndContext(ctx.chat.id, text);
      await ctx.reply(response);
    } catch (error) {
      logger.error('Error handling audio message', error);
      await ctx.reply('Sorry, I encountered an error processing your audio message.');
    }
  });
};

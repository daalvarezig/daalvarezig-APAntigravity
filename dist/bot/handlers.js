"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupHandlers = void 0;
const audio_1 = require("../services/audio");
const memory_1 = require("../services/memory");
const logger_1 = require("../utils/logger");
const filters_1 = require("telegraf/filters");
const setupHandlers = (bot) => {
    bot.on((0, filters_1.message)('text'), async (ctx) => {
        try {
            if (ctx.message.text.startsWith('/'))
                return; // ignore commands here
            await ctx.sendChatAction('typing');
            const response = await (0, memory_1.manageMemoryAndContext)(ctx.chat.id, ctx.message.text);
            await ctx.reply(response);
        }
        catch (error) {
            logger_1.logger.error('Error handling text message', error);
            await ctx.reply('Sorry, I encountered an error processing your message.');
        }
    });
    bot.on([(0, filters_1.message)('voice'), (0, filters_1.message)('audio')], async (ctx) => {
        try {
            await ctx.sendChatAction('typing');
            const fileId = 'voice' in ctx.message ? ctx.message.voice.file_id : ctx.message.audio.file_id;
            const fileLink = await ctx.telegram.getFileLink(fileId);
            const text = await (0, audio_1.processTelegramAudio)(fileLink);
            await ctx.reply(`_Transcribed:_ ${text}`, { parse_mode: 'Markdown' });
            await ctx.sendChatAction('typing');
            const response = await (0, memory_1.manageMemoryAndContext)(ctx.chat.id, text);
            await ctx.reply(response);
        }
        catch (error) {
            logger_1.logger.error('Error handling audio message', error);
            await ctx.reply('Sorry, I encountered an error processing your audio message.');
        }
    });
};
exports.setupHandlers = setupHandlers;

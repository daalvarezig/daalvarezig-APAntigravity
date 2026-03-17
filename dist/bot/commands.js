"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCommands = void 0;
const conversation_1 = require("../db/repositories/conversation");
const message_1 = require("../db/repositories/message");
const memory_1 = require("../db/repositories/memory");
const logger_1 = require("../utils/logger");
const setupCommands = (bot) => {
    bot.start((ctx) => {
        ctx.reply('Hello! I am your personal AI assistant. Send me a text message or a voice note to get started.');
    });
    bot.help((ctx) => {
        ctx.reply('Available commands:\n' +
            '/start - Start interacting\n' +
            '/help - Show this message\n' +
            '/status - Check bot status\n' +
            '/memory - Show extracted memories\n' +
            '/clear - Clear conversation history and memories for this chat\n');
    });
    bot.command('status', (ctx) => {
        ctx.reply('Bot is running properly. Database and AI connection active.');
    });
    bot.command('memory', (ctx) => {
        try {
            const memories = (0, memory_1.getMemories)(ctx.chat.id);
            if (memories.length === 0) {
                return ctx.reply('I have no specific memories stored for you yet.');
            }
            const memText = memories.map((m, i) => `${i + 1}. ${m.content}`).join('\n');
            ctx.reply(`Here is what I remember about you:\n\n${memText}`);
        }
        catch (e) {
            logger_1.logger.error('Error fetching memory', e);
            ctx.reply('Error fetching memory.');
        }
    });
    bot.command('clear', (ctx) => {
        try {
            const conv = (0, conversation_1.getOrCreateConversation)(ctx.chat.id);
            (0, message_1.clearMessages)(conv.id);
            (0, memory_1.clearMemories)(ctx.chat.id);
            ctx.reply('Memory cleared. Starting fresh!');
        }
        catch (e) {
            logger_1.logger.error('Error clearing memory', e);
            ctx.reply('Error clearing memory.');
        }
    });
};
exports.setupCommands = setupCommands;

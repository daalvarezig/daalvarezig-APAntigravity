"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = void 0;
const telegraf_1 = require("telegraf");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const commands_1 = require("./commands");
exports.bot = new telegraf_1.Telegraf(env_1.env.TELEGRAM_BOT_TOKEN);
// Authorization Middleware
exports.bot.use(async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId) {
        logger_1.logger.warn('Received update without user ID');
        return;
    }
    if (env_1.env.TELEGRAM_ALLOWED_USER_IDS.length > 0 && !env_1.env.TELEGRAM_ALLOWED_USER_IDS.includes(userId)) {
        logger_1.logger.warn(`Unauthorized access attempt from user ID: ${userId}`);
        await ctx.reply('Unauthorized. You are not allowed to use this bot.');
        return;
    }
    return next();
});
// Setup commands
(0, commands_1.setupCommands)(exports.bot);
// Error handling
exports.bot.catch((err, ctx) => {
    logger_1.logger.error(`Error for ${ctx.updateType}`, err);
});

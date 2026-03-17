"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const schema_1 = require("./db/schema");
const bot_1 = require("./bot");
const handlers_1 = require("./bot/handlers");
const start = async () => {
    try {
        // 1. Initialize DB
        (0, schema_1.initDb)();
        // 2. Setup message handlers
        (0, handlers_1.setupHandlers)(bot_1.bot);
        // 3. Start Bot
        bot_1.bot.launch();
        logger_1.logger.info(`Bot started in ${env_1.env.NODE_ENV} mode.`);
        // Enable graceful stop
        process.once('SIGINT', () => bot_1.bot.stop('SIGINT'));
        process.once('SIGTERM', () => bot_1.bot.stop('SIGTERM'));
    }
    catch (error) {
        logger_1.logger.error('Failed to start application:', error);
        process.exit(1);
    }
};
start();

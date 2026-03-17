"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from .env file
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
exports.env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_ALLOWED_USER_IDS: process.env.TELEGRAM_ALLOWED_USER_IDS
        ? process.env.TELEGRAM_ALLOWED_USER_IDS.split(',').map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id))
        : [],
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_CHAT_MODEL: process.env.OPENAI_CHAT_MODEL || 'gpt-5-mini', // Default as requested
    OPENAI_TRANSCRIPTION_MODEL: process.env.OPENAI_TRANSCRIPTION_MODEL || 'whisper-1',
    DATABASE_URL: process.env.DATABASE_URL || 'data/database.sqlite',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
// Simple validation
if (!exports.env.TELEGRAM_BOT_TOKEN) {
    console.error("Missing TELEGRAM_BOT_TOKEN in environment variables");
    process.exit(1);
}
if (!exports.env.OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY in environment variables");
    process.exit(1);
}

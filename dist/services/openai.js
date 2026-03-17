"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateChatResponse = exports.transcribeAudio = exports.openai = void 0;
const openai_1 = __importDefault(require("openai"));
const env_1 = require("../config/env");
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("../utils/logger");
exports.openai = new openai_1.default({
    apiKey: env_1.env.OPENAI_API_KEY,
});
const transcribeAudio = async (filePath) => {
    try {
        const transcription = await exports.openai.audio.transcriptions.create({
            file: fs_1.default.createReadStream(filePath),
            model: env_1.env.OPENAI_TRANSCRIPTION_MODEL,
        });
        return transcription.text;
    }
    catch (error) {
        logger_1.logger.error('Error transcribing audio', error);
        throw error;
    }
};
exports.transcribeAudio = transcribeAudio;
const generateChatResponse = async (systemPrompt, messages) => {
    try {
        const apiMessages = [{ role: 'system', content: systemPrompt }, ...messages];
        const response = await exports.openai.chat.completions.create({
            model: env_1.env.OPENAI_CHAT_MODEL,
            messages: apiMessages,
        });
        return response.choices[0]?.message?.content || '';
    }
    catch (error) {
        logger_1.logger.error('Error generating chat response', error);
        throw error;
    }
};
exports.generateChatResponse = generateChatResponse;

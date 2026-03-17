"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processTelegramAudio = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const openai_1 = require("./openai");
const logger_1 = require("../utils/logger");
const processTelegramAudio = async (fileUrl) => {
    const tempFilePath = path_1.default.join(os_1.default.tmpdir(), `audio_${Date.now()}.ogg`);
    try {
        const urlStr = fileUrl.toString();
        const response = await (0, axios_1.default)({
            method: 'get',
            url: urlStr,
            responseType: 'stream',
        });
        const writer = fs_1.default.createWriteStream(tempFilePath);
        await new Promise((resolve, reject) => {
            response.data.pipe(writer);
            let error = null;
            writer.on('error', (err) => {
                error = err;
                writer.close();
                reject(err);
            });
            writer.on('close', () => {
                if (!error)
                    resolve(true);
            });
        });
        const text = await (0, openai_1.transcribeAudio)(tempFilePath);
        return text;
    }
    catch (error) {
        logger_1.logger.error('Error processing audio file:', error);
        throw error;
    }
    finally {
        if (fs_1.default.existsSync(tempFilePath)) {
            try {
                fs_1.default.unlinkSync(tempFilePath);
            }
            catch (e) {
                logger_1.logger.error('Failed to cleanup temp audio file', e);
            }
        }
    }
};
exports.processTelegramAudio = processTelegramAudio;

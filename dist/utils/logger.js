"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const env_1 = require("../config/env");
exports.logger = {
    info: (message, ...args) => {
        if (['info', 'debug'].includes(env_1.env.LOG_LEVEL.toLowerCase())) {
            console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
        }
    },
    warn: (message, ...args) => {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
    },
    error: (message, ...args) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
    },
    debug: (message, ...args) => {
        if (env_1.env.LOG_LEVEL.toLowerCase() === 'debug') {
            console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
        }
    }
};

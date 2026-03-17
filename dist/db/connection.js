"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
// Ensure data directory exists
const dbPath = path_1.default.resolve(process.cwd(), env_1.env.DATABASE_URL);
const dbDir = path_1.default.dirname(dbPath);
if (!fs_1.default.existsSync(dbDir)) {
    fs_1.default.mkdirSync(dbDir, { recursive: true });
}
exports.db = new better_sqlite3_1.default(dbPath);
// Enable WAL for better performance
exports.db.pragma('journal_mode = WAL');
logger_1.logger.info(`Connected to SQLite database at ${dbPath}`);

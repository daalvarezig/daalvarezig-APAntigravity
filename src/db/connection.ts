import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Ensure data directory exists
const dbPath = path.resolve(process.cwd(), env.DATABASE_URL);
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

// Enable WAL for better performance
db.pragma('journal_mode = WAL');

logger.info(`Connected to SQLite database at ${dbPath}`);

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const getEnv = (name: string) => {
  const value = process.env[name];
  if (!value) return undefined;
  // Remove quotes and whitespace
  return value.replace(/^['"]|['"]$/g, '').trim();
};

export const env = {
  NODE_ENV: getEnv('NODE_ENV') || 'development',
  TELEGRAM_BOT_TOKEN: getEnv('TELEGRAM_BOT_TOKEN'),
  TELEGRAM_ALLOWED_USER_IDS: process.env.TELEGRAM_ALLOWED_USER_IDS
    ? process.env.TELEGRAM_ALLOWED_USER_IDS.replace(/^['"]|['"]$/g, '').split(',').map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id))
    : [],
  OPENAI_API_KEY: getEnv('OPENAI_API_KEY'),
  OPENAI_CHAT_MODEL: getEnv('OPENAI_CHAT_MODEL') || 'gpt-4o-mini', // Fixed to real model
  OPENAI_TRANSCRIPTION_MODEL: getEnv('OPENAI_TRANSCRIPTION_MODEL') || 'whisper-1',
  DATABASE_URL: getEnv('DATABASE_URL') || 'data/database.sqlite',
  LOG_LEVEL: getEnv('LOG_LEVEL') || 'info',
  N8N_WEBHOOK_URL: getEnv('N8N_WEBHOOK_URL') || 'https://n8n.itopy.ai/webhook/gmail-search',
  GOOGLE_CLIENT_EMAIL: getEnv('GOOGLE_CLIENT_EMAIL'),
  GOOGLE_PRIVATE_KEY: getEnv('GOOGLE_PRIVATE_KEY') 
    ? getEnv('GOOGLE_PRIVATE_KEY')!.replace(/\\n/g, '\n').replace(/['"]/g, '').trim() 
    : undefined,
};

if (env.GOOGLE_PRIVATE_KEY) {
  const lines = env.GOOGLE_PRIVATE_KEY.split('\n');
  console.log(`[DEBUG] Google Private Key loaded. Lines: ${lines.length}, Starts with: ${env.GOOGLE_PRIVATE_KEY.substring(0, 30)}...`);
} else {
  console.warn("[WARN] GOOGLE_PRIVATE_KEY is not defined in environment.");
}

// Simple validation
if (!env.TELEGRAM_BOT_TOKEN) {
  console.error("Missing TELEGRAM_BOT_TOKEN in environment variables");
  process.exit(1);
} else {
  console.log(`[DEBUG] Telegram Token loaded. Length: ${env.TELEGRAM_BOT_TOKEN.length} chars.`);
}

if (!env.OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY in environment variables");
  process.exit(1);
}

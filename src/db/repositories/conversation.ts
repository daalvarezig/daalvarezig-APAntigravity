import { db } from '../connection';

export interface Conversation {
  id: number;
  telegram_chat_id: number;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export const getOrCreateConversation = (telegram_chat_id: number): Conversation => {
  const existing = db.prepare('SELECT * FROM conversations WHERE telegram_chat_id = ?').get(telegram_chat_id) as Conversation | undefined;
  if (existing) {
    return existing;
  }
  
  const result = db.prepare('INSERT INTO conversations (telegram_chat_id) VALUES (?)').run(telegram_chat_id);
  return db.prepare('SELECT * FROM conversations WHERE id = ?').get(result.lastInsertRowid) as Conversation;
};

export const updateConversationSummary = (id: number, summary: string): void => {
  db.prepare('UPDATE conversations SET summary = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(summary, id);
};

export const getConversationByChatId = (telegram_chat_id: number): Conversation | undefined => {
  return db.prepare('SELECT * FROM conversations WHERE telegram_chat_id = ?').get(telegram_chat_id) as Conversation | undefined;
}

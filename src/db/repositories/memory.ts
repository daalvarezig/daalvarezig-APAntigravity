import { db } from '../connection';

export interface Memory {
  id: number;
  telegram_chat_id: number;
  content: string;
  created_at: string;
}

export const addMemory = (telegram_chat_id: number, content: string): Memory => {
  const result = db.prepare('INSERT INTO memories (telegram_chat_id, content) VALUES (?, ?)')
    .run(telegram_chat_id, content);
    
  return db.prepare('SELECT * FROM memories WHERE id = ?').get(result.lastInsertRowid) as Memory;
};

export const getMemories = (telegram_chat_id: number): Memory[] => {
  return db.prepare('SELECT * FROM memories WHERE telegram_chat_id = ? ORDER BY id ASC').all(telegram_chat_id) as Memory[];
};

export const deleteMemory = (id: number): void => {
  db.prepare('DELETE FROM memories WHERE id = ?').run(id);
};

export const clearMemories = (telegram_chat_id: number): void => {
  db.prepare('DELETE FROM memories WHERE telegram_chat_id = ?').run(telegram_chat_id);
};

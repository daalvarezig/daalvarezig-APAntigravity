import { db } from '../connection';

export interface Message {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export const addMessage = (conversation_id: number, role: 'user' | 'assistant' | 'system', content: string): Message => {
  const result = db.prepare('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)')
    .run(conversation_id, role, content);
    
  return db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid) as Message;
};

export const getRecentMessages = (conversation_id: number, limit: number = 10): Message[] => {
  const messages = db.prepare(`
    SELECT * FROM messages 
    WHERE conversation_id = ? 
    ORDER BY id DESC 
    LIMIT ?
  `).all(conversation_id, limit) as Message[];
  return messages.reverse();
};

export const countMessages = (conversation_id: number): number => {
  const row = db.prepare('SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?').get(conversation_id) as { count: number };
  return row.count;
};

export const getAllMessages = (conversation_id: number): Message[] => {
  return db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC').all(conversation_id) as Message[];
}

export const deleteOldMessages = (conversation_id: number, keepLastN: number): void => {
  db.prepare(`
    DELETE FROM messages 
    WHERE conversation_id = ? 
    AND id NOT IN (
      SELECT id FROM messages 
      WHERE conversation_id = ? 
      ORDER BY id DESC 
      LIMIT ?
    )
  `).run(conversation_id, conversation_id, keepLastN);
};

export const clearMessages = (conversation_id: number): void => {
  db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(conversation_id);
}

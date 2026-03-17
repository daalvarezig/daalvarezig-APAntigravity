"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearMessages = exports.deleteOldMessages = exports.getAllMessages = exports.countMessages = exports.getRecentMessages = exports.addMessage = void 0;
const connection_1 = require("../connection");
const addMessage = (conversation_id, role, content) => {
    const result = connection_1.db.prepare('INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)')
        .run(conversation_id, role, content);
    return connection_1.db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);
};
exports.addMessage = addMessage;
const getRecentMessages = (conversation_id, limit = 10) => {
    const messages = connection_1.db.prepare(`
    SELECT * FROM messages 
    WHERE conversation_id = ? 
    ORDER BY id DESC 
    LIMIT ?
  `).all(conversation_id, limit);
    return messages.reverse();
};
exports.getRecentMessages = getRecentMessages;
const countMessages = (conversation_id) => {
    const row = connection_1.db.prepare('SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?').get(conversation_id);
    return row.count;
};
exports.countMessages = countMessages;
const getAllMessages = (conversation_id) => {
    return connection_1.db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC').all(conversation_id);
};
exports.getAllMessages = getAllMessages;
const deleteOldMessages = (conversation_id, keepLastN) => {
    connection_1.db.prepare(`
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
exports.deleteOldMessages = deleteOldMessages;
const clearMessages = (conversation_id) => {
    connection_1.db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(conversation_id);
};
exports.clearMessages = clearMessages;

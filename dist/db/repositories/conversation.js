"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConversationByChatId = exports.updateConversationSummary = exports.getOrCreateConversation = void 0;
const connection_1 = require("../connection");
const getOrCreateConversation = (telegram_chat_id) => {
    const existing = connection_1.db.prepare('SELECT * FROM conversations WHERE telegram_chat_id = ?').get(telegram_chat_id);
    if (existing) {
        return existing;
    }
    const result = connection_1.db.prepare('INSERT INTO conversations (telegram_chat_id) VALUES (?)').run(telegram_chat_id);
    return connection_1.db.prepare('SELECT * FROM conversations WHERE id = ?').get(result.lastInsertRowid);
};
exports.getOrCreateConversation = getOrCreateConversation;
const updateConversationSummary = (id, summary) => {
    connection_1.db.prepare('UPDATE conversations SET summary = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(summary, id);
};
exports.updateConversationSummary = updateConversationSummary;
const getConversationByChatId = (telegram_chat_id) => {
    return connection_1.db.prepare('SELECT * FROM conversations WHERE telegram_chat_id = ?').get(telegram_chat_id);
};
exports.getConversationByChatId = getConversationByChatId;

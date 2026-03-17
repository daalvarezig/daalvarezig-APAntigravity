"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearMemories = exports.deleteMemory = exports.getMemories = exports.addMemory = void 0;
const connection_1 = require("../connection");
const addMemory = (telegram_chat_id, content) => {
    const result = connection_1.db.prepare('INSERT INTO memories (telegram_chat_id, content) VALUES (?, ?)')
        .run(telegram_chat_id, content);
    return connection_1.db.prepare('SELECT * FROM memories WHERE id = ?').get(result.lastInsertRowid);
};
exports.addMemory = addMemory;
const getMemories = (telegram_chat_id) => {
    return connection_1.db.prepare('SELECT * FROM memories WHERE telegram_chat_id = ? ORDER BY id ASC').all(telegram_chat_id);
};
exports.getMemories = getMemories;
const deleteMemory = (id) => {
    connection_1.db.prepare('DELETE FROM memories WHERE id = ?').run(id);
};
exports.deleteMemory = deleteMemory;
const clearMemories = (telegram_chat_id) => {
    connection_1.db.prepare('DELETE FROM memories WHERE telegram_chat_id = ?').run(telegram_chat_id);
};
exports.clearMemories = clearMemories;

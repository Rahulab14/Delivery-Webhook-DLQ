const Database = require("better-sqlite3");

const db = new Database("./data/dlq.db");

db.exec(`CREATE TABLE IF NOT EXISTS dead_letter_queue (
    id TEXT PRIMARY KEY,
    delivery_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    error_message TEXT NOT NULL,
    error_type TEXT,
    retry_count INTEGER NOT NULL,
    first_failed_at TEXT,
    last_failed_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'failed',
    requeued_at TEXT
)`);

module.exports = db;

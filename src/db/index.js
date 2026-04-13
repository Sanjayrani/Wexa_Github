'use strict';

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');
const logger   = require('../utils/logger');

const DB_PATH = process.env.DB_PATH || './data/bot.db';
let db;

function getDb() {
  if (!db) throw new Error('Database not initialised. Call initDb() first.');
  return db;
}

async function initDb() {
  const dir = path.dirname(path.resolve(DB_PATH));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(path.resolve(DB_PATH));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS run_logs (
      id              TEXT PRIMARY KEY,
      triggered_at    TEXT NOT NULL,
      trigger_type    TEXT NOT NULL CHECK(trigger_type IN ('scheduled','manual')),
      tickets_found   INTEGER DEFAULT 0,
      comments_posted INTEGER DEFAULT 0,
      slack_sent      INTEGER DEFAULT 0,
      errors          TEXT DEFAULT '[]',
      duration_ms     INTEGER DEFAULT 0
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS developer_map (
      linear_id        TEXT PRIMARY KEY,
      name             TEXT NOT NULL,
      email            TEXT,
      slack_user_id    TEXT,
      last_seen_active TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const now = new Date().toISOString();
  const insertConfig = db.prepare(`INSERT OR IGNORE INTO config (key, value, updated_at) VALUES (?, ?, ?)`);
  insertConfig.run('comment_template', 'Hey @{{developer_name}}, this is your scheduled status check-in. Could you share: 1. Current progress 2. Any blockers 3. ETA? — Auto-sent at {{time}}', now);
  insertConfig.run('slack_template', 'Hi {{developer_name}} We noticed you have no tickets In Progress in Linear. What are you currently working on?', now);

  logger.info(`SQLite database ready at ${DB_PATH}`);
  return db;
}

module.exports = { getDb, initDb };
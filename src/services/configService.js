'use strict';

const { getDb } = require('../db');
const logger    = require('../utils/logger');

async function getConfig(key, defaultValue = null) {
  const db  = getDb();
  const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key);
  return row ? row.value : defaultValue;
}

async function setConfig(key, value) {
  const db  = getDb();
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO config (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`).run(key, value, now);
  logger.info(`Config updated: ${key}`);
}

async function getAllConfig() {
  const db   = getDb();
  const rows = db.prepare('SELECT key, value, updated_at FROM config').all();
  return Object.fromEntries(rows.map(r => [r.key, { value: r.value, updatedAt: r.updated_at }]));
}

module.exports = { getConfig, setConfig, getAllConfig };
'use strict';

const { getDb } = require('../db');

exports.list = (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit || '50', 10), 200);
  const offset = parseInt(req.query.offset || '0', 10);
  const db     = getDb();
  const rows   = db.prepare('SELECT * FROM run_logs ORDER BY triggered_at DESC LIMIT ? OFFSET ?').all(limit, offset);
  const total  = db.prepare('SELECT COUNT(*) as cnt FROM run_logs').get().cnt;
  res.json({ success: true, total, limit, offset, data: rows.map(parseErrors) });
};

exports.get = (req, res) => {
  const db  = getDb();
  const row = db.prepare('SELECT * FROM run_logs WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ success: false, error: 'Run not found' });
  res.json({ success: true, data: parseErrors(row) });
};

function parseErrors(row) {
  try { row.errors = JSON.parse(row.errors); } catch {}
  return row;
}
'use strict';

const { getAllConfig, setConfig } = require('../services/configService');

exports.getAll = async (_req, res) => {
  try {
    const cfg = await getAllConfig();
    res.json({ success: true, data: cfg });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.update = async (req, res) => {
  const updates = req.body;
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return res.status(400).json({ success: false, error: 'Body must be a JSON object of { key: value } pairs' });
  }
  try {
    for (const [key, value] of Object.entries(updates)) {
      await setConfig(key, String(value));
    }
    const cfg = await getAllConfig();
    res.json({ success: true, message: 'Config updated', data: cfg });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
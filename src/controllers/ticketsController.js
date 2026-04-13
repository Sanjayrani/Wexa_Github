'use strict';

const linearService = require('../services/linearService');

exports.inProgress = async (_req, res) => {
  try {
    const issues = await linearService.getInProgressIssues();
    res.json({ success: true, count: issues.length, data: issues });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
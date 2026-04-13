'use strict';

const { runWorkflow } = require('../services/workflowService');
const logger          = require('../utils/logger');

exports.trigger = async (_req, res) => {
  try {
    logger.info('Manual workflow trigger received');
    const summary = await runWorkflow('manual');
    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    logger.error(`Manual trigger failed: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
};
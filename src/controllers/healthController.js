'use strict';

const scheduler = require('../scheduler');

exports.check = (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), schedules: scheduler.getSchedules() });
};
'use strict';

const cron   = require('node-cron');
const logger = require('./utils/logger');
const { runWorkflow } = require('./services/workflowService');

const SCHEDULES = [
  process.env.SCHEDULE_1 || '0 13 * * *',
  process.env.SCHEDULE_2 || '0 16 * * *',
  process.env.SCHEDULE_3 || '0 18 * * *',
];

const TZ = process.env.SCHEDULE_TIMEZONE || 'Asia/Kolkata';
const tasks = [];

function init() {
  for (const expr of SCHEDULES) {
    if (!cron.validate(expr)) {
      logger.warn(`Invalid cron expression ignored: "${expr}"`);
      continue;
    }
    const task = cron.schedule(
      expr,
      async () => {
        logger.info(`Scheduled run triggered by cron: ${expr}`);
        try {
          await runWorkflow('scheduled');
        } catch (err) {
          logger.error(`Scheduled run failed: ${err.message}`);
        }
      },
      { timezone: TZ, scheduled: true }
    );
    tasks.push({ expr, task });
    logger.info(`Cron scheduled: "${expr}" (tz=${TZ})`);
  }
}

function getSchedules() {
  return SCHEDULES.map((expr, i) => ({
    index: i, expr, timezone: TZ, active: !!(tasks[i]),
  }));
}

function destroy() {
  for (const { task } of tasks) task.destroy();
  tasks.length = 0;
}

module.exports = { init, getSchedules, destroy };
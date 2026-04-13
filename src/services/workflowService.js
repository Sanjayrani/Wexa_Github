'use strict';

const { v4: uuidv4 }            = require('uuid');
const { getDb }                 = require('../db');
const linearService             = require('./linearService');
const slackService              = require('./slackService');
const { getConfig }             = require('./configService');
const { sleep, formatTemplate } = require('../utils/helpers');
const logger                    = require('../utils/logger');

const RATE_DELAY = parseInt(process.env.API_RATE_DELAY_MS || '300', 10);

async function runWorkflow(triggerType = 'manual') {
  const runId   = uuidv4();
  const startAt = Date.now();
  const runTime = new Date().toISOString();
  const errors  = [];

  logger.info(`[${runId}] Workflow started (trigger=${triggerType})`);

  let allMembers = [];
  try {
    allMembers = await linearService.getOrganizationMembers();
  } catch (err) {
    errors.push({ step: 'fetchMembers', message: err.message });
  }

  const db = getDb();
  const upsertDev = db.prepare(`
    INSERT INTO developer_map (linear_id, name, email, slack_user_id, last_seen_active)
    VALUES (@linear_id, @name, @email, @slack_user_id, @last_seen_active)
    ON CONFLICT(linear_id) DO UPDATE SET name = excluded.name, email = excluded.email
  `);
  for (const m of allMembers) {
    upsertDev.run({ linear_id: m.id, name: m.displayName || m.name, email: m.email || null, slack_user_id: null, last_seen_active: null });
  }

  let issues = [];
  try {
    issues = await linearService.getInProgressIssues();
  } catch (err) {
    errors.push({ step: 'fetchIssues', message: err.message });
  }

  const assigneeMap     = new Map();
  const activeLinearIds = new Set();
  for (const issue of issues) {
    const { id, name, email, displayName } = issue.assignee;
    activeLinearIds.add(id);
    if (!assigneeMap.has(id)) assigneeMap.set(id, { member: { id, name: displayName || name, email }, issues: [] });
    assigneeMap.get(id).issues.push(issue);
  }

  const commentTemplate = await getConfig('comment_template');
  let commentsPosted = 0;
  for (const [, { member, issues: devIssues }] of assigneeMap) {
    for (const issue of devIssues) {
      const body = formatTemplate(commentTemplate, {
        developer_name: member.name,
        time:           new Date().toLocaleTimeString('en-IN', { timeZone: process.env.SCHEDULE_TIMEZONE || 'UTC' }),
        ticket_id:      issue.identifier,
        ticket_title:   issue.title,
      });
      try {
        await linearService.postComment(issue.id, body);
        commentsPosted++;
      } catch (err) {
        errors.push({ step: 'postComment', issueId: issue.id, message: err.message });
      }
      await sleep(RATE_DELAY);
    }
  }

  const slackTemplate = await getConfig('slack_template');
  let slackSent = 0;
  const idleMembers = allMembers.filter(m => !activeLinearIds.has(m.id));
  for (const member of idleMembers) {
    const devName = member.displayName || member.name;
    if (!member.email) continue;
    let slackUserId;
    try {
      slackUserId = await slackService.resolveSlackUserId(member.email);
    } catch (err) {
      errors.push({ step: 'resolveSlack', email: member.email, message: err.message });
      continue;
    }
    if (!slackUserId) continue;
    db.prepare('UPDATE developer_map SET slack_user_id = ? WHERE linear_id = ?').run(slackUserId, member.id);
    const msg = formatTemplate(slackTemplate, { developer_name: devName });
    try {
      await slackService.sendDirectMessage(slackUserId, msg);
      slackSent++;
    } catch (err) {
      errors.push({ step: 'sendSlack', slackUserId, message: err.message });
    }
    await sleep(RATE_DELAY);
  }

  const durationMs = Date.now() - startAt;
  db.prepare(`INSERT INTO run_logs (id, triggered_at, trigger_type, tickets_found, comments_posted, slack_sent, errors, duration_ms) VALUES (@id, @triggered_at, @trigger_type, @tickets_found, @comments_posted, @slack_sent, @errors, @duration_ms)`).run({
    id: runId, triggered_at: runTime, trigger_type: triggerType,
    tickets_found: issues.length, comments_posted: commentsPosted,
    slack_sent: slackSent, errors: JSON.stringify(errors), duration_ms: durationMs,
  });

  logger.info(`[${runId}] Workflow complete — tickets=${issues.length} comments=${commentsPosted} slacks=${slackSent} errors=${errors.length}`);
  return { runId, triggeredAt: runTime, triggerType, ticketsFound: issues.length, commentsPosted, slackSent, idleDevelopers: idleMembers.length, errors, durationMs };
}

module.exports = { runWorkflow };
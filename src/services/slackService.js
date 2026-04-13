'use strict';

const { WebClient } = require('@slack/web-api');
const logger = require('../utils/logger');

let _slack;
const emailCache = new Map();

function getSlack() {
  if (!_slack) {
    const token = process.env.SLACK_BOT_TOKEN;
    if (!token) throw new Error('SLACK_BOT_TOKEN is not set');
    _slack = new WebClient(token);
  }
  return _slack;
}

async function resolveSlackUserId(email) {
  if (!email) return null;
  if (emailCache.has(email)) return emailCache.get(email);
  try {
    const res = await getSlack().users.lookupByEmail({ email });
    const userId = res.user?.id || null;
    if (userId) emailCache.set(email, userId);
    return userId;
  } catch (err) {
    if (err.data?.error === 'users_not_found') {
      logger.warn(`Slack: no user found for email ${email}`);
      return null;
    }
    throw err;
  }
}

async function sendDirectMessage(slackUserId, text) {
  const slack = getSlack();
  const { channel } = await slack.conversations.open({ users: slackUserId });
  const res = await slack.chat.postMessage({ channel: channel.id, text, unfurl_links: false });
  logger.debug(`Slack DM sent to ${slackUserId} (ts=${res.ts})`);
  return res;
}

async function listWorkspaceMembers() {
  const slack = getSlack();
  const members = [];
  let cursor;
  do {
    const res = await slack.users.list({ cursor, limit: 200 });
    for (const m of res.members) {
      if (!m.is_bot && !m.deleted && m.id !== 'USLACKBOT') members.push(m);
    }
    cursor = res.response_metadata?.next_cursor;
  } while (cursor);
  return members;
}

module.exports = { resolveSlackUserId, sendDirectMessage, listWorkspaceMembers };
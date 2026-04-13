'use strict';

const { GraphQLClient, gql } = require('graphql-request');
const logger = require('../utils/logger');

const LINEAR_ENDPOINT = 'https://api.linear.app/graphql';

function getClient() {
  const key = process.env.LINEAR_API_KEY;
  if (!key) throw new Error('LINEAR_API_KEY is not set');
  return new GraphQLClient(LINEAR_ENDPOINT, { headers: { Authorization: key } });
}

const GET_IN_PROGRESS_ISSUES = gql`
  query GetInProgressIssues {
    issues(filter: { state: { type: { eq: "started" } } } first: 250) {
      nodes {
        id title url identifier updatedAt
        assignee { id name email displayName }
        state { name type }
      }
    }
  }
`;

const GET_IN_PROGRESS_ISSUES_BY_TEAM = gql`
  query GetInProgressIssuesByTeam($teamId: String!) {
    issues(filter: { state: { type: { eq: "started" } } team: { id: { eq: $teamId } } } first: 250) {
      nodes {
        id title url identifier updatedAt
        assignee { id name email displayName }
        state { name type }
      }
    }
  }
`;

const GET_ORGANIZATION_MEMBERS = gql`
  query GetOrganizationMembers {
    users(filter: { active: { eq: true } }) {
      nodes { id name displayName email active }
    }
  }
`;

const CREATE_COMMENT = gql`
  mutation CreateComment($issueId: String!, $body: String!) {
    commentCreate(input: { issueId: $issueId, body: $body }) {
      success
      comment { id body createdAt }
    }
  }
`;

async function getInProgressIssues() {
  const client = getClient();
  const teamId = process.env.LINEAR_TEAM_ID || '';
  const data = teamId
    ? await client.request(GET_IN_PROGRESS_ISSUES_BY_TEAM, { teamId })
    : await client.request(GET_IN_PROGRESS_ISSUES);
  const issues = data.issues.nodes.filter(i => i.assignee);
  logger.info(`Found ${issues.length} in-progress issue(s) with assignees`);
  return issues;
}

async function getOrganizationMembers() {
  const client = getClient();
  const data = await client.request(GET_ORGANIZATION_MEMBERS);
  const members = data.users.nodes;
  logger.info(`Found ${members.length} active member(s)`);
  return members;
}

async function postComment(issueId, body) {
  const client = getClient();
  const data = await client.request(CREATE_COMMENT, { issueId, body });
  if (!data.commentCreate.success) {
    throw new Error(`Linear commentCreate returned success=false for issue ${issueId}`);
  }
  return data.commentCreate.comment;
}

module.exports = { getInProgressIssues, getOrganizationMembers, postComment };
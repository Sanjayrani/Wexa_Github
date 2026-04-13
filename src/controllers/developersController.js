'use strict';

const linearService = require('../services/linearService');

exports.idle = async (_req, res) => {
  try {
    const [allMembers, issues] = await Promise.all([
      linearService.getOrganizationMembers(),
      linearService.getInProgressIssues(),
    ]);
    const activeIds = new Set(issues.map(i => i.assignee?.id).filter(Boolean));
    const idle      = allMembers.filter(m => !activeIds.has(m.id));
    res.json({ success: true, totalMembers: allMembers.length, idleCount: idle.length, data: idle });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
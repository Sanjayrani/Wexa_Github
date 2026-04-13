'use strict';

function adminMiddleware(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!key || key !== process.env.APP_ADMIN_KEY) {
    return res.status(403).json({ error: 'Forbidden — admin access required' });
  }
  next();
}

module.exports = adminMiddleware;
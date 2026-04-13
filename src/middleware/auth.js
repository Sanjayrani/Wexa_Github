'use strict';

function authMiddleware(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== process.env.APP_API_KEY) {
    return res.status(401).json({ error: 'Unauthorised — invalid or missing API key' });
  }
  next();
}

module.exports = authMiddleware;
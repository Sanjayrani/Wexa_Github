'use strict';

require('dotenv').config();
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const logger     = require('./utils/logger');
const scheduler  = require('./scheduler');
const routes     = require('./routes');
const { initDb } = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(morgan('combined', { stream: { write: msg => logger.http(msg.trim()) } }));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.use('/api', routes);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err, _req, res, _next) => {
  logger.error(err.stack || err.message);
  res.status(500).json({ error: 'Internal server error' });
});

async function bootstrap() {
  try {
    await initDb();
    logger.info('Database initialised');
    scheduler.init();
    logger.info('Scheduler initialised');
    app.listen(PORT, () => {
      logger.info(`Linear-Slack Status Bot listening on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start:', err);
    process.exit(1);
  }
}

bootstrap();

module.exports = app;
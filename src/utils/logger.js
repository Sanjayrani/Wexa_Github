'use strict';

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, errors } = format;

const logFmt = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}] ${stack || message}`;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFmt,
  ),
  transports: [
    new transports.Console({ format: combine(colorize(), logFmt) }),
  ],
});

if (process.env.NODE_ENV === 'production') {
  logger.add(new transports.File({ filename: 'logs/error.log', level: 'error' }));
  logger.add(new transports.File({ filename: 'logs/combined.log' }));
}

module.exports = logger;
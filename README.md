# Linear + Slack Developer Status Bot

Automated status tracking bot that integrates **Linear** and **Slack** to keep engineering teams accountable. It posts scheduled status-update comments on active Linear tickets and sends Slack DMs to developers with no in-progress work.

---

## Features

- Fetches all In Progress tickets from Linear
- Posts a status-request comment tagging the assigned developer
- Sends Slack DMs to developers with no active tickets
- Scheduled runs at configurable times (default: 1 PM, 4 PM, 6 PM IST)
- Manual trigger via POST /api/trigger
- Full run audit logs stored in SQLite
- API key auth on all endpoints

---

## Quick Start

1. Clone and install: git clone <your-repo-url> && cd linear-slack-status-bot && npm install
2. Configure: cp .env.example .env and fill in your keys
3. Run: npm start
4. Docker: docker-compose up -d

---

## License

MIT
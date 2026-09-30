const path = require('node:path');
const fs = require('node:fs');

// This command is deliberately local. Public hosting gets its own configuration.
if (process.env.MONGODB_URI || process.env.MONGO_URL) {
  throw new Error('Local comments use file storage; unset MONGODB_URI and MONGO_URL.');
}
process.env.TWIKOO_HOST = '127.0.0.1';
process.env.TWIKOO_PORT = '8080';
process.env.TWIKOO_DATA = path.resolve(__dirname, '../../.local/twikoo');
process.env.TWIKOO_LOG_LEVEL = 'info';
fs.mkdirSync(process.env.TWIKOO_DATA, { recursive: true });
require('tkserver/server.js');

import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

const defaultBaseUrl = 'http://localhost:3000';
const rawValue = process.env.NG_APP_API_BASE_URL || defaultBaseUrl;
const sanitized = rawValue.replace(/\/$/, '');

const config = {
  NG_APP_API_BASE_URL: sanitized
};

const outputPath = resolve(process.cwd(), 'public', 'env.js');
mkdirSync(dirname(outputPath), { recursive: true });

const fileContent = `window.__env = Object.assign(window.__env || {}, ${JSON.stringify(config, null, 2)});`;

writeFileSync(outputPath, fileContent, 'utf8');

console.log(`[env] NG_APP_API_BASE_URL set to ${sanitized}`);

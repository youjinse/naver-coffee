import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

export function getConfig() {
  return {
    rootDir,
    eventUrl: process.env.NAVER_CAFE_EVENT_URL ?? 'http://campaign2.naver.com/npay/cafe/',
    userDataDir: resolveFromRoot(process.env.USER_DATA_DIR ?? '.playwright/naver-profile'),
    screenshotDir: resolveFromRoot(process.env.SCREENSHOT_DIR ?? 'screenshots'),
    discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
    headless: (process.env.HEADLESS ?? 'true').toLowerCase() !== 'false',
    applyTimeoutMs: Number.parseInt(process.env.APPLY_TIMEOUT_MS ?? '20000', 10),
  };
}

function resolveFromRoot(value) {
  return path.isAbsolute(value) ? value : path.resolve(rootDir, value);
}

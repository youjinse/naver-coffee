import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { chromium } from 'playwright';
import { getConfig } from './config.js';
import { loadEnvFile } from './env.js';

loadEnvFile();

const config = getConfig();
const context = await chromium.launchPersistentContext(config.userDataDir, {
  headless: false,
  viewport: { width: 430, height: 900 },
  isMobile: true,
  hasTouch: true,
});

const page = context.pages()[0] ?? await context.newPage();
await page.goto(config.eventUrl, { waitUntil: 'domcontentloaded' });

console.log('브라우저에서 네이버 로그인을 완료하세요.');
console.log(`세션 저장 위치: ${config.userDataDir}`);
console.log('로그인이 끝나면 이 터미널에서 Enter를 누르면 됩니다.');

const rl = readline.createInterface({ input, output });
await rl.question('');
rl.close();

await context.close();
console.log('로그인 세션 저장 완료');

import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { getConfig } from './config.js';
import { notifyDiscord } from './discord.js';
import { loadEnvFile } from './env.js';

loadEnvFile();

const config = getConfig();
const resultColors = {
  success: 0x2ecc71,
  skipped: 0xf1c40f,
  failed: 0xe74c3c,
};

let context;
let screenshotPath;

try {
  await fs.mkdir(config.screenshotDir, { recursive: true });
  context = await chromium.launchPersistentContext(config.userDataDir, {
    headless: config.headless,
    viewport: { width: 430, height: 900 },
    isMobile: true,
    hasTouch: true,
  });

  const page = context.pages()[0] ?? await context.newPage();
  page.setDefaultTimeout(config.applyTimeoutMs);

  await page.goto(config.eventUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

  screenshotPath = await saveScreenshot(page, config.screenshotDir, 'before');

  if (isLoginPage(page.url()) || await hasLoginPrompt(page)) {
    await sendResult('failed', '네이버 로그인 세션이 만료되었습니다.', '브라우저를 열어 `npm run setup-login`으로 다시 로그인해 주세요.', screenshotPath);
    process.exitCode = 1;
  } else if (await isBenefitCompleted(page)) {
    await sendResult('skipped', '네이버페이 카페 혜택이 이미 신청되어 있습니다.', '이번 주 신청 완료 상태를 확인했습니다.', screenshotPath);
  } else if (await isEventEnded(page)) {
    await sendResult('skipped', '네이버페이 카페 이벤트가 현재 종료 상태입니다.', '페이지에서 이벤트 종료 문구를 확인했습니다.', screenshotPath);
  } else {
    const applyButton = page.getByText(/혜택\s*신청하기/).last();
    await applyButton.waitFor({ state: 'visible' });
    await applyButton.click();

    await Promise.race([
      page.getByText(/혜택\s*신청\s*완료/).first().waitFor({ state: 'visible' }),
      page.waitForTimeout(3000),
    ]);
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    screenshotPath = await saveScreenshot(page, config.screenshotDir, 'after');

    if (isLoginPage(page.url()) || await hasLoginPrompt(page)) {
      await sendResult('failed', '네이버 로그인 세션이 만료되었습니다.', '버튼 클릭 후 로그인 페이지로 이동했습니다. `npm run setup-login`으로 다시 로그인해 주세요.', screenshotPath);
      process.exitCode = 1;
    } else if (await isBenefitCompleted(page)) {
      await sendResult('success', '네이버페이 카페 혜택 신청 완료', '이번 주 혜택 신청 버튼을 눌렀고 완료 상태를 확인했습니다.', screenshotPath);
    } else {
      await sendResult('success', '네이버페이 카페 혜택 신청 시도 완료', '버튼 클릭은 성공했지만 완료 문구는 확인하지 못했습니다. 첨부 스크린샷을 확인해 주세요.', screenshotPath);
    }
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  await sendResult('failed', '네이버페이 카페 혜택 신청 실패', message, screenshotPath);
  process.exitCode = 1;
} finally {
  await context?.close();
}

async function isBenefitCompleted(page) {
  return await page.getByText(/혜택\s*신청\s*완료/).first().isVisible().catch(() => false);
}

async function isEventEnded(page) {
  return await page.getByText(/이벤트가\s*종료되었습니다|다시\s*찾아올\s*예정입니다/).first().isVisible().catch(() => false);
}

async function hasLoginPrompt(page) {
  return await page.getByText(/로그인/).first().isVisible().catch(() => false);
}

function isLoginPage(url) {
  return new URL(url).hostname.includes('nid.naver.com');
}

async function saveScreenshot(page, screenshotDir, label) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotPath = path.join(screenshotDir, `${timestamp}-${label}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

async function sendResult(status, title, description, screenshotPath) {
  console.log(`[${status}] ${title} - ${description}`);
  await notifyDiscord({
    webhookUrl: config.discordWebhookUrl,
    title,
    description,
    color: resultColors[status],
    screenshotPath,
  });
}

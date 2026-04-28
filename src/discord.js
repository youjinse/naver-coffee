import fs from 'node:fs/promises';

export async function notifyDiscord({ webhookUrl, title, description, color, screenshotPath }) {
  if (!webhookUrl) {
    console.log(`[discord skipped] ${title}: ${description}`);
    return;
  }

  const payload = {
    embeds: [
      {
        title,
        description,
        color,
        timestamp: new Date().toISOString(),
      },
    ],
  };

  let response;
  if (screenshotPath) {
    const screenshot = await fs.readFile(screenshotPath);
    const form = new FormData();
    form.append('payload_json', JSON.stringify(payload));
    form.append('files[0]', new Blob([screenshot], { type: 'image/png' }), 'naver-cafe.png');
    response = await fetch(webhookUrl, { method: 'POST', body: form });
  } else {
    response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Discord webhook failed: ${response.status} ${body}`);
  }
}

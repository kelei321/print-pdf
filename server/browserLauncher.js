import { existsSync } from 'node:fs';
import { chromium } from 'playwright';
import { pdfConfig } from './config.js';
import { PdfError } from './errors.js';

const fallbackChannels = process.platform === 'win32' ? ['msedge', 'chrome'] : ['chrome', 'msedge'];
const fallbackExecutables = process.platform === 'win32'
  ? []
  : ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/snap/bin/chromium'];

export function createBrowserLaunchCandidates(config = pdfConfig) {
  const baseOptions = {
    headless: true,
    chromiumSandbox: config.browserSandbox,
    args: ['--disable-dev-shm-usage']
  };

  const candidates = [];

  if (config.browserExecutablePath) {
    candidates.push({
      label: `executable:${config.browserExecutablePath}`,
      options: { ...baseOptions, executablePath: config.browserExecutablePath }
    });
  }

  if (config.browserChannel) {
    candidates.push({
      label: `channel:${config.browserChannel}`,
      options: { ...baseOptions, channel: config.browserChannel }
    });
  }

  candidates.push({ label: 'playwright:chromium', options: baseOptions });

  for (const executablePath of fallbackExecutables) {
    if (executablePath !== config.browserExecutablePath && existsSync(executablePath)) {
      candidates.push({ label: `executable:${executablePath}`, options: { ...baseOptions, executablePath } });
    }
  }

  for (const channel of fallbackChannels) {
    if (channel !== config.browserChannel) {
      candidates.push({ label: `channel:${channel}`, options: { ...baseOptions, channel } });
    }
  }

  return candidates;
}

export async function launchBrowser(config = pdfConfig) {
  const candidates = createBrowserLaunchCandidates(config);
  let lastError;

  for (const candidate of candidates) {
    try {
      const browser = await chromium.launch(candidate.options);
      browser.__pdfLaunchLabel = candidate.label;
      return browser;
    } catch (error) {
      lastError = error;
      console.warn('PDF_BROWSER_LAUNCH_FAILED', {
        candidate: candidate.label,
        message: error?.message
      });
    }
  }

  throw new PdfError(
    'PDF_BROWSER_UNAVAILABLE',
    `No usable Chromium browser was found. Set PDF_BROWSER_EXECUTABLE_PATH or run npx playwright install chromium. Last error: ${lastError?.message || 'unknown'}`,
    503
  );
}

export async function assertBrowserReady(config = pdfConfig) {
  const browser = await launchBrowser(config);
  const page = await browser.newPage();

  try {
    await page.setContent('<!doctype html><html><body><script>window.__PDF_READY_CHECK__=true</script></body></html>');
    await page.waitForFunction(() => window.__PDF_READY_CHECK__ === true, null, { timeout: 5000 });
    return {
      ok: true,
      browser: browser.__pdfLaunchLabel || 'unknown'
    };
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

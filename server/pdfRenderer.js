import { chromium } from 'playwright';
import { pdfConfig } from './config.js';
import { PdfError } from './errors.js';

let browserPromise;

export function validateRenderRequest(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new PdfError('PDF_INVALID_REQUEST', 'Request body must be a JSON object');
  }

  if (typeof payload.html !== 'string' || payload.html.trim().length === 0) {
    throw new PdfError('PDF_HTML_REQUIRED', 'html is required');
  }

  if (Buffer.byteLength(payload.html, 'utf8') > pdfConfig.maxHtmlBytes) {
    throw new PdfError('PDF_HTML_TOO_LARGE', 'html exceeds the maximum allowed size', 413);
  }

  if (/file:\/\//i.test(payload.html)) {
    throw new PdfError('PDF_FILE_URL_FORBIDDEN', 'file:// resources are not allowed');
  }

  return {
    html: payload.html,
    filename: sanitizeFilename(payload.filename || 'document.pdf'),
    paper: typeof payload.paper === 'string' && payload.paper ? payload.paper : pdfConfig.defaultPaper,
    margin: normalizeMargin(payload.margin),
    metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}
  };
}

export async function renderPdf(request) {
  const browser = await getBrowser();
  const context = await browser.newContext({
    javaScriptEnabled: true,
    bypassCSP: false
  });
  const page = await context.newPage();

  try {
    page.setDefaultTimeout(pdfConfig.renderTimeoutMs);
    await page.route('file://**', (route) => route.abort());
    await page.setContent(request.html, {
      waitUntil: 'networkidle',
      timeout: pdfConfig.renderTimeoutMs
    });
    await page.waitForFunction(() => window.__PRINT_READY__ === true, null, {
      timeout: pdfConfig.renderTimeoutMs
    });

    return await page.pdf({
      format: request.paper,
      margin: request.margin,
      printBackground: true,
      preferCSSPageSize: true,
      timeout: pdfConfig.renderTimeoutMs
    });
  } catch (error) {
    if (String(error?.message || '').includes('Timeout')) {
      throw new PdfError('PDF_RENDER_TIMEOUT', 'PDF render timed out', 504);
    }

    throw error;
  } finally {
    await context.close().catch(() => {});
  }
}

export async function closeBrowser() {
  if (!browserPromise) return;
  const browser = await browserPromise;
  browserPromise = undefined;
  await browser.close();
}

function getBrowser() {
  if (!browserPromise) {
    browserPromise = launchBrowser();
  }

  return browserPromise;
}

async function launchBrowser() {
  const launchOptions = {
    headless: true
  };

  if (pdfConfig.browserExecutablePath) {
    return chromium.launch({
      ...launchOptions,
      executablePath: pdfConfig.browserExecutablePath
    });
  }

  if (pdfConfig.browserChannel) {
    return chromium.launch({
      ...launchOptions,
      channel: pdfConfig.browserChannel
    });
  }

  try {
    return await chromium.launch(launchOptions);
  } catch (error) {
    const fallbackChannels = process.platform === 'win32' ? ['msedge', 'chrome'] : ['chrome', 'msedge'];
    let lastError = error;

    for (const channel of fallbackChannels) {
      try {
        console.warn('PDF_BROWSER_FALLBACK', {
          channel,
          reason: error?.message
        });

        return await chromium.launch({
          ...launchOptions,
          channel
        });
      } catch (fallbackError) {
        lastError = fallbackError;
      }
    }

    throw lastError;
  }
}

function normalizeMargin(margin) {
  const fallback = pdfConfig.defaultMargin;

  if (!margin || typeof margin !== 'object') {
    return fallback;
  }

  return {
    top: coerceCssLength(margin.top, fallback.top),
    right: coerceCssLength(margin.right, fallback.right),
    bottom: coerceCssLength(margin.bottom, fallback.bottom),
    left: coerceCssLength(margin.left, fallback.left)
  };
}

function coerceCssLength(value, fallback) {
  if (typeof value !== 'string') return fallback;
  return /^(\d+(\.\d+)?)(px|in|cm|mm)$/.test(value) ? value : fallback;
}

function sanitizeFilename(value) {
  const filename = String(value).replace(/[\\/:*?"<>|]+/g, '-').trim() || 'document.pdf';
  return filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
}

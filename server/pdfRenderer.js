import { pdfConfig } from './config.js';
import { PdfError } from './errors.js';
import { launchBrowser } from './browserLauncher.js';

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
    paper: normalizePaper(payload.paper),
    margin: normalizeMargin(payload.margin),
    metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}
  };
}

export async function renderPdf(request) {
  const browser = await getBrowser();
  const context = await browser.newContext({
    javaScriptEnabled: pdfConfig.allowHtmlJavaScript,
    bypassCSP: false,
    acceptDownloads: false
  });
  const page = await context.newPage();

  try {
    page.setDefaultTimeout(pdfConfig.renderTimeoutMs);
    page.on('popup', (popup) => popup.close().catch(() => {}));
    page.on('download', (download) => download.cancel().catch(() => {}));
    await page.route('**/*', createResourceGuard());

    await runWithTimeoutCode(
      () => page.setContent(request.html, { waitUntil: 'networkidle', timeout: pdfConfig.renderTimeoutMs }),
      'PDF_HTML_LOAD_TIMEOUT',
      'HTML load timed out'
    );

    await runWithTimeoutCode(
      () => waitForPrintReady(page),
      'PDF_PRINT_READY_TIMEOUT',
      'Waiting for printable assets timed out'
    );

    return await runWithTimeoutCode(
      () =>
        page.pdf({
          format: request.paper,
          margin: request.margin,
          printBackground: true,
          preferCSSPageSize: true,
          timeout: pdfConfig.renderTimeoutMs
        }),
      'PDF_RENDER_TIMEOUT',
      'PDF render timed out'
    );
  } finally {
    await context.close().catch(() => {});
  }
}

export async function checkRendererReady() {
  const browser = await getBrowser();
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
    const launchPromise = launchBrowser();
    browserPromise = launchPromise;
    launchPromise.then((browser) => {
      browser.once('disconnected', () => {
        if (browserPromise === launchPromise) browserPromise = undefined;
      });
    }).catch((error) => {
      if (browserPromise === launchPromise) browserPromise = undefined;
      return error;
    });
  }

  return browserPromise;
}

async function waitForPrintReady(page) {
  if (pdfConfig.allowHtmlJavaScript) {
    await page.waitForFunction(() => window.__PRINT_READY__ === true, null, {
      timeout: pdfConfig.printReadyTimeoutMs
    });
    return;
  }

  await page.waitForFunction(
    () => (!document.fonts || document.fonts.status === 'loaded') && Array.from(document.images).every((image) => image.complete),
    null,
    { timeout: pdfConfig.printReadyTimeoutMs }
  );
}

function createResourceGuard() {
  return async function guardResource(route) {
    const url = route.request().url();
    const decision = getResourceDecision(url);

    if (decision.allow) {
      await route.continue();
      return;
    }

    console.warn('PDF_RESOURCE_BLOCKED', {
      url,
      reason: decision.reason
    });
    await route.abort('blockedbyclient');
  };
}

function getResourceDecision(url) {
  let parsed;

  try {
    parsed = new URL(url);
  } catch {
    return { allow: false, reason: 'invalid-url' };
  }

  if (parsed.protocol === 'file:') {
    return { allow: false, reason: 'file-url' };
  }

  if (['data:', 'blob:', 'about:'].includes(parsed.protocol)) {
    return { allow: true };
  }

  if (['http:', 'https:'].includes(parsed.protocol)) {
    if (pdfConfig.allowExternalResources) return { allow: true };
    if (pdfConfig.allowedResourceOrigins.includes(parsed.origin)) return { allow: true };
    return { allow: false, reason: 'external-resource' };
  }

  return { allow: false, reason: 'unsupported-protocol' };
}

async function runWithTimeoutCode(task, code, message) {
  try {
    return await task();
  } catch (error) {
    if (isTimeoutError(error)) {
      throw new PdfError(code, message, 504);
    }
    throw error;
  }
}

function isTimeoutError(error) {
  return /timeout|timed out/i.test(String(error?.message || ''));
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

function normalizePaper(value) {
  const paper = String(value || pdfConfig.defaultPaper).toUpperCase();
  return ['A3', 'A4'].includes(paper) ? paper : pdfConfig.defaultPaper;
}

function coerceCssLength(value, fallback) {
  if (typeof value !== 'string') return fallback;
  return /^(\d+(\.\d+)?)(px|in|cm|mm)$/.test(value) ? value : fallback;
}

function sanitizeFilename(value) {
  const filename = String(value).replace(/[\\/:*?"<>|]+/g, '-').trim() || 'document.pdf';
  return filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
}

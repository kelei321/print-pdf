import { EventEmitter } from 'node:events';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { launchBrowser } from '../server/browserLauncher.js';
import {
  createBrowserContextOptions,
  createBrowserProvider,
  waitForPrintReady
} from '../server/pdfRenderer.js';

describe('PDF renderer isolation', () => {
  let browser;

  afterAll(async () => {
    await browser?.close();
  });

  it('does not execute submitted JavaScript by default', async () => {
    browser = await launchBrowser();
    const context = await browser.newContext(createBrowserContextOptions({ allowHtmlJavaScript: false }));
    const page = await context.newPage();

    try {
      await page.setContent('<body><script>document.body.dataset.executed="true"</script></body>');
      expect(await page.getAttribute('body', 'data-executed')).toBeNull();
    } finally {
      await context.close();
    }
  });

  it('executes trusted template JavaScript and waits for its ready marker when enabled', async () => {
    browser ??= await launchBrowser();
    const config = { allowHtmlJavaScript: true, printReadyTimeoutMs: 2000 };
    const context = await browser.newContext(createBrowserContextOptions(config));
    const page = await context.newPage();

    try {
      await page.setContent('<body><script>setTimeout(() => { window.__PRINT_READY__ = true }, 25)</script></body>');
      await waitForPrintReady(page, config);
      expect(await page.evaluate(() => window.__PRINT_READY__)).toBe(true);
    } finally {
      await context.close();
    }
  });

  it('waits for fonts and images in the default mode', async () => {
    const page = { waitForFunction: vi.fn(async () => {}) };
    await waitForPrintReady(page, { allowHtmlJavaScript: false, printReadyTimeoutMs: 1234 });

    const [readinessCheck, argument, options] = page.waitForFunction.mock.calls[0];
    const originalDocument = globalThis.document;
    try {
      globalThis.document = { fonts: { status: 'loading' }, images: [{ complete: false }] };
      expect(readinessCheck()).toBe(false);
      globalThis.document = { fonts: { status: 'loaded' }, images: [{ complete: true }] };
      expect(readinessCheck()).toBe(true);
    } finally {
      globalThis.document = originalDocument;
    }
    expect(argument).toBeNull();
    expect(options).toEqual({ timeout: 1234 });
  });

  it('waits for the trusted template marker when JavaScript is enabled', async () => {
    const page = { waitForFunction: vi.fn(async () => {}) };
    await waitForPrintReady(page, { allowHtmlJavaScript: true, printReadyTimeoutMs: 4321 });

    const [readinessCheck, argument, options] = page.waitForFunction.mock.calls[0];
    const originalWindow = globalThis.window;
    try {
      globalThis.window = { __PRINT_READY__: false };
      expect(readinessCheck()).toBe(false);
      globalThis.window.__PRINT_READY__ = true;
      expect(readinessCheck()).toBe(true);
    } finally {
      globalThis.window = originalWindow;
    }
    expect(argument).toBeNull();
    expect(options).toEqual({ timeout: 4321 });
  });
});

describe('browser cache recovery', () => {
  it('retries launch after the cached launch promise rejects', async () => {
    const browser = new EventEmitter();
    const launch = vi.fn()
      .mockRejectedValueOnce(new Error('launch failed'))
      .mockResolvedValueOnce(browser);
    const provider = createBrowserProvider(launch);

    await expect(provider.get()).rejects.toThrow('launch failed');
    expect(await provider.get()).toBe(browser);
    expect(launch).toHaveBeenCalledTimes(2);
  });

  it('launches a new browser after the cached browser disconnects', async () => {
    const browsers = [new EventEmitter(), new EventEmitter()];
    const launch = vi.fn()
      .mockResolvedValueOnce(browsers[0])
      .mockResolvedValueOnce(browsers[1]);
    const provider = createBrowserProvider(launch);

    expect(await provider.get()).toBe(browsers[0]);
    browsers[0].emit('disconnected');
    expect(await provider.get()).toBe(browsers[1]);
    expect(launch).toHaveBeenCalledTimes(2);
  });
});

import { launchBrowser } from './browserLauncher.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildPageCss } from '../src/print/buildReportHtml.js';
import { printCss } from '../src/print/printCss.js';

let browser;

describe('print layout guardrails', () => {
  beforeAll(async () => {
    browser = await launchBrowser();
  });

  afterAll(async () => {
    await browser?.close();
  });

  it('does not force a blank trailing A3 landscape page for short content', async () => {
    const report = {
      paper: 'A3',
      orientation: 'landscape'
    };
    const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <style>${printCss}${buildPageCss(report)}</style>
  </head>
  <body>
    <article class="print-page print-page--a3 print-page--landscape" style="--print-page-padding: 12mm">
      <section style="height: 120mm; border: 1px solid #000">A3 summary content</section>
    </article>
  </body>
</html>`;

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.emulateMedia({ media: 'print' });

    const layout = await page.locator('.print-page').evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        height: rect.height,
        minHeight: style.minHeight,
        scrollHeight: el.scrollHeight
      };
    });

    await page.close();

    expect(layout.minHeight).toBe('0px');
    expect(layout.height).toBeLessThan(1122.52);
    expect(layout.scrollHeight).toBeLessThan(1123);
  });
});

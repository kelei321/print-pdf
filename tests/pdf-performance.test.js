import { afterAll, describe, expect, it } from 'vitest';
import { performance } from 'node:perf_hooks';
import { buildReportHtml } from '../src/print/buildReportHtml.js';
import { createSampleReport } from '../src/print/sampleReport.js';
import { closeBrowser, renderPdf, validateRenderRequest } from '../server/pdfRenderer.js';

const rowCounts = [30, 360, 1000];
const optionalRowCounts = String(process.env.PDF_PERF_ROWS || '')
  .split(',')
  .map((item) => Number(item.trim()))
  .filter((item) => Number.isFinite(item) && item > 0);

describe('PDF performance baseline', () => {
  afterAll(async () => {
    await closeBrowser();
  });

  it.each([...rowCounts, ...optionalRowCounts])('renders A3 ledger with %i rows', async (rowCount) => {
    const startedAt = performance.now();
    const report = createSampleReport(rowCount, 'a3-ledger');
    const html = await buildReportHtml(report);
    const htmlReadyAt = performance.now();
    const request = validateRenderRequest({
      html,
      filename: `perf-a3-ledger-${rowCount}.pdf`,
      paper: report.paper,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      metadata: { type: report.type, rows: rowCount }
    });

    const pdf = await renderPdf(request);
    const finishedAt = performance.now();
    const metrics = {
      rowCount,
      htmlBytes: Buffer.byteLength(html, 'utf8'),
      htmlBuildMs: Math.round(htmlReadyAt - startedAt),
      pdfRenderMs: Math.round(finishedAt - htmlReadyAt),
      totalMs: Math.round(finishedAt - startedAt),
      pdfBytes: pdf.byteLength
    };

    console.info('PDF_PERFORMANCE_BASELINE', metrics);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  }, 240000);
});

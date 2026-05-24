import { afterAll, describe, expect, it } from 'vitest';
import { buildReportHtml } from '../src/print/buildReportHtml.js';
import { createSampleReport, printExamples } from '../src/print/sampleReport.js';
import { closeBrowser, renderPdf, validateRenderRequest } from '../server/pdfRenderer.js';

const rowCountByExample = {
  'a3-ledger': 360
};

describe('PDF smoke rendering', () => {
  afterAll(async () => {
    await closeBrowser();
  });

  it.each(printExamples.map((example) => [example.id, example.name]))('renders %s - %s to a valid PDF', async (exampleId) => {
    const report = createSampleReport(rowCountByExample[exampleId] || 30, exampleId);
    const html = await buildReportHtml(report);
    const request = validateRenderRequest({
      html,
      filename: `${report.type}-${report.reportNo}.pdf`,
      paper: report.paper,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      metadata: { type: report.type, rows: report.rows?.length || 0 }
    });

    const pdf = await renderPdf(request);

    expect(pdf.byteLength).toBeGreaterThan(50_000);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  }, 180000);
});

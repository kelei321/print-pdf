export const pdfConfig = {
  port: Number(process.env.PORT || 3000),
  maxHtmlBytes: Number(process.env.PDF_MAX_HTML_BYTES || 20 * 1024 * 1024),
  renderTimeoutMs: Number(process.env.PDF_RENDER_TIMEOUT_MS || 120000),
  maxConcurrentRenders: Number(process.env.PDF_MAX_CONCURRENT || 3),
  browserChannel: process.env.PDF_BROWSER_CHANNEL || '',
  browserExecutablePath: process.env.PDF_BROWSER_EXECUTABLE_PATH || '',
  defaultPaper: 'A4',
  defaultMargin: {
    top: '16mm',
    right: '14mm',
    bottom: '16mm',
    left: '14mm'
  }
};

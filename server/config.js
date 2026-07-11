function readBoolean(name, fallback = false) {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function readCsv(name) {
  return String(process.env[name] || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const maxHtmlBytes = Number(process.env.PDF_MAX_HTML_BYTES || 20 * 1024 * 1024);
const maxRequestBytes = Math.max(
  maxHtmlBytes,
  Number(process.env.PDF_MAX_REQUEST_BYTES || maxHtmlBytes + 1024 * 1024)
);

export const pdfConfig = {
  port: Number(process.env.PORT || 3000),
  maxHtmlBytes,
  maxRequestBytes,
  renderTimeoutMs: Number(process.env.PDF_RENDER_TIMEOUT_MS || 120000),
  printReadyTimeoutMs: Number(process.env.PDF_PRINT_READY_TIMEOUT_MS || process.env.PDF_RENDER_TIMEOUT_MS || 120000),
  maxConcurrentRenders: Number(process.env.PDF_MAX_CONCURRENT || 3),
  maxQueuedRenders: Number(process.env.PDF_MAX_QUEUE || 20),
  renderQueueTimeoutMs: Number(process.env.PDF_QUEUE_TIMEOUT_MS || 30000),
  browserChannel: process.env.PDF_BROWSER_CHANNEL || '',
  browserExecutablePath: process.env.PDF_BROWSER_EXECUTABLE_PATH || '',
  browserSandbox: readBoolean('PDF_BROWSER_SANDBOX', false),
  allowExternalResources: readBoolean('PDF_ALLOW_EXTERNAL_RESOURCES', false),
  allowHtmlJavaScript: readBoolean('PDF_ALLOW_HTML_JAVASCRIPT', false),
  allowedResourceOrigins: readCsv('PDF_ALLOWED_RESOURCE_ORIGINS'),
  defaultPaper: 'A4',
  defaultMargin: {
    top: '16mm',
    right: '14mm',
    bottom: '16mm',
    left: '14mm'
  }
};

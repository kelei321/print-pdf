import { createApp } from './app.js';
import { pdfConfig } from './config.js';
import { closeBrowser } from './pdfRenderer.js';

const app = createApp();
const server = app.listen(pdfConfig.port, () => {
  console.log(`PDF server listening on http://127.0.0.1:${pdfConfig.port}`);
});

async function shutdown() {
  server.close(async () => {
    await closeBrowser();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

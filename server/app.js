import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import { pdfConfig } from './config.js';
import { toErrorResponse } from './errors.js';
import { createLimiter } from './limiter.js';
import { renderPdf, validateRenderRequest } from './pdfRenderer.js';

export function createApp({ renderer = renderPdf } = {}) {
  const app = express();
  const withLimit = createLimiter(pdfConfig.maxConcurrentRenders);

  app.use(cors());
  app.use(bodyParser.json({ limit: `${pdfConfig.maxHtmlBytes}b` }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/pdf/render', async (req, res) => {
    const startedAt = Date.now();
    let renderRequest;

    try {
      renderRequest = validateRenderRequest(req.body);
      const pdf = await withLimit(() => renderer(renderRequest));

      console.info('PDF_RENDER_SUCCESS', {
        durationMs: Date.now() - startedAt,
        filename: renderRequest.filename,
        metadata: renderRequest.metadata
      });

      res.setHeader('X-PDF-Render-Duration-Ms', String(Date.now() - startedAt));
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', contentDisposition(renderRequest.filename));
      res.send(pdf);
    } catch (error) {
      const response = toErrorResponse(error);

      console.error('PDF_RENDER_ERROR', {
        durationMs: Date.now() - startedAt,
        code: response.body.code,
        message: error?.message,
        metadata: renderRequest?.metadata
      });

      res.status(response.status).json(response.body);
    }
  });

  app.use((error, _req, res, _next) => {
    const response = toErrorResponse(error);
    res.status(response.status).json(response.body);
  });

  return app;
}

function contentDisposition(filename) {
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${filename.replaceAll('"', '')}"; filename*=UTF-8''${encoded}`;
}

import cors from 'cors';
import express from 'express';
import { pdfConfig } from './config.js';
import { toErrorResponse } from './errors.js';
import { createRenderQueue } from './renderQueue.js';
import { renderPdf, validateRenderRequest, checkRendererReady } from './pdfRenderer.js';
import { createRequestId } from './requestId.js';

export function createApp({ renderer = renderPdf, readyCheck = checkRendererReady, queueConfig = {} } = {}) {
  const app = express();
  const renderQueue = createRenderQueue({
    maxConcurrent: queueConfig.maxConcurrent ?? pdfConfig.maxConcurrentRenders,
    maxQueue: queueConfig.maxQueue ?? pdfConfig.maxQueuedRenders,
    queueTimeoutMs: queueConfig.queueTimeoutMs ?? pdfConfig.renderQueueTimeoutMs
  });

  app.use(cors());
  app.use(express.json({ limit: `${pdfConfig.maxHtmlBytes}b` }));
  app.use((req, res, next) => {
    req.requestId = req.headers['x-request-id'] || createRequestId();
    res.setHeader('X-Request-Id', req.requestId);
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/status', (req, res) => {
    res.json({
      ok: true,
      requestId: req.requestId,
      queue: renderQueue.getStats(),
      limits: {
        maxHtmlBytes: pdfConfig.maxHtmlBytes,
        renderTimeoutMs: pdfConfig.renderTimeoutMs,
        printReadyTimeoutMs: pdfConfig.printReadyTimeoutMs,
        allowExternalResources: pdfConfig.allowExternalResources,
        allowedResourceOrigins: pdfConfig.allowedResourceOrigins
      }
    });
  });

  app.get('/api/ready', async (req, res) => {
    const startedAt = Date.now();

    try {
      const result = await readyCheck();
      res.json({
        ...result,
        requestId: req.requestId,
        durationMs: Date.now() - startedAt
      });
    } catch (error) {
      const response = toErrorResponse(error);
      res.status(response.status).json({
        ...response.body,
        requestId: req.requestId,
        durationMs: Date.now() - startedAt
      });
    }
  });

  app.post('/api/pdf/render', async (req, res) => {
    const startedAt = Date.now();
    let renderRequest;

    try {
      renderRequest = validateRenderRequest(req.body);
      let queuedMs = 0;
      const pdf = await renderQueue.enqueue((context) => {
        queuedMs = context.queuedMs;
        return renderer(renderRequest);
      }, renderRequest.metadata);

      console.info('PDF_RENDER_SUCCESS', {
        requestId: req.requestId,
        durationMs: Date.now() - startedAt,
        queuedMs,
        filename: renderRequest.filename,
        metadata: renderRequest.metadata
      });

      res.setHeader('X-PDF-Render-Duration-Ms', String(Date.now() - startedAt));
      res.setHeader('X-PDF-Queue-Duration-Ms', String(queuedMs));
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', contentDisposition(renderRequest.filename));
      res.send(pdf);
    } catch (error) {
      const response = toErrorResponse(error);

      console.error('PDF_RENDER_ERROR', {
        requestId: req.requestId,
        durationMs: Date.now() - startedAt,
        queue: renderQueue.getStats(),
        code: response.body.code,
        message: error?.message,
        metadata: renderRequest?.metadata
      });

      res.status(response.status).json({
        ...response.body,
        requestId: req.requestId
      });
    }
  });

  app.use((error, req, res, _next) => {
    const response = toErrorResponse(error);
    res.status(response.status).json({
      ...response.body,
      requestId: req.requestId
    });
  });

  return app;
}

function contentDisposition(filename) {
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${filename.replaceAll('"', '')}"; filename*=UTF-8''${encoded}`;
}

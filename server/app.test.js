import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app.js';

const readyHtml = '<!doctype html><html><body><script>window.__PRINT_READY__=true</script></body></html>';


describe('GET /api/status', () => {
  it('returns queue and limit metadata', async () => {
    const app = createApp({ renderer: vi.fn() });

    const response = await request(app).get('/api/status').set('X-Request-Id', 'req-status');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        ok: true,
        requestId: 'req-status',
        queue: expect.objectContaining({ active: 0, queued: 0, maxConcurrent: expect.any(Number) }),
        limits: expect.objectContaining({
          maxHtmlBytes: expect.any(Number),
          maxRequestBytes: expect.any(Number),
          allowHtmlJavaScript: false
        })
      })
    );
  });
});

describe('request parsing errors', () => {
  it.each([
    ['a generated request id', undefined],
    ['the caller request id', 'req-too-large']
  ])('returns 413 with %s when JSON exceeds the configured limit', async (_label, requestId) => {
    const app = createApp({ renderer: vi.fn(), requestBodyLimitBytes: 128 });
    let pendingRequest = request(app)
      .post('/api/pdf/render')
      .send({ html: 'x'.repeat(256) });

    if (requestId) pendingRequest = pendingRequest.set('X-Request-Id', requestId);
    const response = await pendingRequest;

    expect(response.status).toBe(413);
    expect(response.body.code).toBe('PDF_REQUEST_TOO_LARGE');
    expect(response.body.requestId).toBeTruthy();
    expect(response.headers['x-request-id']).toBe(response.body.requestId);
    if (requestId) expect(response.body.requestId).toBe(requestId);
  });
});

describe('GET /api/ready', () => {
  it('returns renderer readiness with a request id', async () => {
    const app = createApp({ readyCheck: vi.fn(async () => ({ ok: true, browser: 'mock' })) });

    const response = await request(app).get('/api/ready').set('X-Request-Id', 'req-test');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({ ok: true, browser: 'mock', requestId: 'req-test' }));
    expect(response.headers['x-request-id']).toBe('req-test');
  });
});

describe('POST /api/pdf/render', () => {
  it('returns a PDF response with the requested filename', async () => {
    const renderer = vi.fn(async () => Buffer.from('%PDF-1.4 mock'));
    const app = createApp({ renderer });

    const response = await request(app)
      .post('/api/pdf/render')
      .set('X-Request-Id', 'req-render')
      .send({
        html: readyHtml,
        filename: 'contract-20260428.pdf',
        metadata: { businessId: '123', type: 'contract' }
      });

    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toBe('req-render');
    expect(response.headers['content-type']).toContain('application/pdf');
    expect(response.headers['content-disposition']).toContain('contract-20260428.pdf');
    expect(renderer).toHaveBeenCalledWith(
      expect.objectContaining({
        html: readyHtml,
        filename: 'contract-20260428.pdf',
        paper: 'A4',
        metadata: { businessId: '123', type: 'contract' }
      })
    );
  });

  it('rejects missing html', async () => {
    const app = createApp({ renderer: vi.fn() });

    const response = await request(app).post('/api/pdf/render').send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual(
      expect.objectContaining({
        code: 'PDF_HTML_REQUIRED',
        message: 'html is required'
      })
    );
    expect(response.body.requestId).toBeTruthy();
  });

  it('rejects file URLs in html', async () => {
    const app = createApp({ renderer: vi.fn() });

    const response = await request(app)
      .post('/api/pdf/render')
      .send({ html: '<img src="file:///etc/passwd">' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('PDF_FILE_URL_FORBIDDEN');
  });

  it('normalizes unsafe filenames and unsupported paper values', async () => {
    const renderer = vi.fn(async () => Buffer.from('%PDF-1.4 mock'));
    const app = createApp({ renderer });

    const response = await request(app)
      .post('/api/pdf/render')
      .send({ html: readyHtml, filename: '../bad:name', paper: 'letter' });

    expect(response.status).toBe(200);
    expect(renderer).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: '..-bad-name.pdf',
        paper: 'A4'
      })
    );
  });


  it('queues concurrent render requests and returns queue duration header', async () => {
    const renderer = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 25));
      return Buffer.from('%PDF-1.4 mock');
    });
    const app = createApp({ renderer, queueConfig: { maxConcurrent: 1, maxQueue: 2, queueTimeoutMs: 2000 } });

    const [first, second] = await Promise.all([
      request(app).post('/api/pdf/render').send({ html: readyHtml, filename: 'first.pdf' }),
      request(app).post('/api/pdf/render').send({ html: readyHtml, filename: 'second.pdf' })
    ]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.headers['x-pdf-queue-duration-ms']).toBe('0');
    expect(Number(second.headers['x-pdf-queue-duration-ms'])).toBeGreaterThanOrEqual(0);
    expect(renderer).toHaveBeenCalledTimes(2);
  });

  it('rejects render requests when the queue is full', async () => {
    const renderer = vi.fn(() => new Promise((resolve) => setTimeout(() => resolve(Buffer.from('%PDF-1.4 mock')), 40)));
    const app = createApp({ renderer, queueConfig: { maxConcurrent: 1, maxQueue: 0, queueTimeoutMs: 2000 } });

    const [first, second] = await Promise.all([
      request(app).post('/api/pdf/render').send({ html: readyHtml, filename: 'first.pdf' }),
      request(app).post('/api/pdf/render').send({ html: readyHtml, filename: 'second.pdf' })
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([200, 429]);
    const rejected = [first, second].find((item) => item.status === 429);
    expect(rejected.body.code).toBe('PDF_RENDER_QUEUE_FULL');
  });

  it('returns a structured error when rendering fails', async () => {
    const app = createApp({
      renderer: vi.fn(async () => {
        throw new Error('boom');
      })
    });

    const response = await request(app).post('/api/pdf/render').send({ html: readyHtml });

    expect(response.status).toBe(500);
    expect(response.body).toEqual(
      expect.objectContaining({
        code: 'PDF_RENDER_FAILED',
        message: 'PDF render failed'
      })
    );
  });
});

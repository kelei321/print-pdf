import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app.js';

const readyHtml = '<!doctype html><html><body><script>window.__PRINT_READY__=true</script></body></html>';

describe('POST /api/pdf/render', () => {
  it('returns a PDF response with the requested filename', async () => {
    const renderer = vi.fn(async () => Buffer.from('%PDF-1.4 mock'));
    const app = createApp({ renderer });

    const response = await request(app)
      .post('/api/pdf/render')
      .send({
        html: readyHtml,
        filename: 'contract-20260428.pdf',
        metadata: { businessId: '123', type: 'contract' }
      });

    expect(response.status).toBe(200);
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
    expect(response.body).toEqual({
      code: 'PDF_HTML_REQUIRED',
      message: 'html is required'
    });
  });

  it('rejects file URLs in html', async () => {
    const app = createApp({ renderer: vi.fn() });

    const response = await request(app)
      .post('/api/pdf/render')
      .send({ html: '<img src="file:///etc/passwd">' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('PDF_FILE_URL_FORBIDDEN');
  });

  it('returns a structured error when rendering fails', async () => {
    const app = createApp({
      renderer: vi.fn(async () => {
        throw new Error('boom');
      })
    });

    const response = await request(app).post('/api/pdf/render').send({ html: readyHtml });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      code: 'PDF_RENDER_FAILED',
      message: 'PDF render failed'
    });
  });
});

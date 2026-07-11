import { describe, expect, it } from 'vitest';
import { resolvePdfSizeLimits } from './config.js';

describe('PDF size limits', () => {
  it('uses a bounded default that reserves space for JSON escaping', () => {
    const limits = resolvePdfSizeLimits({});

    expect(limits.maxRequestBytes).toBeGreaterThan(limits.maxHtmlBytes);
    expect(limits.maxRequestBytes).toBe(limits.maxHtmlBytes * 2 + 1024 * 1024);
  });

  it('uses explicit valid limits', () => {
    expect(resolvePdfSizeLimits({
      PDF_MAX_HTML_BYTES: '1024',
      PDF_MAX_REQUEST_BYTES: '4096'
    })).toEqual({ maxHtmlBytes: 1024, maxRequestBytes: 4096 });
  });

  it.each([
    ['equal limits', { PDF_MAX_HTML_BYTES: '1024', PDF_MAX_REQUEST_BYTES: '1024' }],
    ['a smaller request limit', { PDF_MAX_HTML_BYTES: '1024', PDF_MAX_REQUEST_BYTES: '512' }]
  ])('rejects %s', (_label, env) => {
    expect(() => resolvePdfSizeLimits(env)).toThrow('PDF_MAX_REQUEST_BYTES must be greater than PDF_MAX_HTML_BYTES');
  });

  it.each([
    ['PDF_MAX_HTML_BYTES', 'not-a-number'],
    ['PDF_MAX_HTML_BYTES', 'NaN'],
    ['PDF_MAX_HTML_BYTES', '-1'],
    ['PDF_MAX_HTML_BYTES', '0'],
    ['PDF_MAX_REQUEST_BYTES', 'not-a-number'],
    ['PDF_MAX_REQUEST_BYTES', 'NaN'],
    ['PDF_MAX_REQUEST_BYTES', '-1'],
    ['PDF_MAX_REQUEST_BYTES', '0']
  ])('rejects invalid %s value %s', (name, value) => {
    expect(() => resolvePdfSizeLimits({ [name]: value })).toThrow(`${name} must be a finite positive integer`);
  });
});

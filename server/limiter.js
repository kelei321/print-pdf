import { PdfError } from './errors.js';

export function createLimiter(maxConcurrent) {
  let active = 0;

  return async function withLimit(task) {
    if (active >= maxConcurrent) {
      throw new PdfError('PDF_RENDER_BUSY', 'PDF renderer is busy', 429);
    }

    active += 1;
    try {
      return await task();
    } finally {
      active -= 1;
    }
  };
}

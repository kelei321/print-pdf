import { PdfError } from './errors.js';

export function createRenderQueue({ maxConcurrent = 3, maxQueue = 20, queueTimeoutMs = 30000 } = {}) {
  const safeMaxConcurrent = Math.max(1, Number(maxConcurrent) || 1);
  const safeMaxQueue = Math.max(0, Number(maxQueue) || 0);
  const safeQueueTimeoutMs = Math.max(1000, Number(queueTimeoutMs) || 30000);
  let active = 0;
  let completed = 0;
  let rejected = 0;
  const waiting = [];

  async function enqueue(task, metadata = {}) {
    if (typeof task !== 'function') {
      throw new PdfError('PDF_RENDER_TASK_INVALID', 'Render task must be a function', 500);
    }

    if (active < safeMaxConcurrent) {
      return runTask(task, metadata, 0);
    }

    if (waiting.length >= safeMaxQueue) {
      rejected += 1;
      throw new PdfError('PDF_RENDER_QUEUE_FULL', 'PDF render queue is full', 429);
    }

    return new Promise((resolve, reject) => {
      const queuedAt = Date.now();
      const item = {
        task,
        metadata,
        resolve,
        reject,
        queuedAt,
        timeout: setTimeout(() => {
          const index = waiting.indexOf(item);
          if (index >= 0) waiting.splice(index, 1);
          rejected += 1;
          reject(new PdfError('PDF_RENDER_QUEUE_TIMEOUT', 'PDF render queue timed out', 429));
        }, safeQueueTimeoutMs)
      };

      waiting.push(item);
    });
  }

  function getStats() {
    return {
      active,
      queued: waiting.length,
      completed,
      rejected,
      maxConcurrent: safeMaxConcurrent,
      maxQueue: safeMaxQueue,
      queueTimeoutMs: safeQueueTimeoutMs
    };
  }

  async function runTask(task, metadata, queuedMs) {
    active += 1;
    try {
      return await task({ queuedMs, metadata });
    } finally {
      active -= 1;
      completed += 1;
      drain();
    }
  }

  function drain() {
    while (active < safeMaxConcurrent && waiting.length > 0) {
      const item = waiting.shift();
      clearTimeout(item.timeout);
      const queuedMs = Date.now() - item.queuedAt;
      runTask(item.task, item.metadata, queuedMs).then(item.resolve, item.reject);
    }
  }

  return { enqueue, getStats };
}

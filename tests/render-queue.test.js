import { describe, expect, it } from 'vitest';
import { createRenderQueue } from '../server/renderQueue.js';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('render queue', () => {
  it('queues work instead of failing immediately when concurrency is full', async () => {
    const queue = createRenderQueue({ maxConcurrent: 1, maxQueue: 1, queueTimeoutMs: 2000 });
    const order = [];

    const first = queue.enqueue(async () => {
      order.push('first-start');
      await delay(20);
      order.push('first-end');
      return 'first';
    });

    const second = queue.enqueue(async ({ queuedMs }) => {
      order.push('second-start');
      expect(queuedMs).toBeGreaterThanOrEqual(0);
      return 'second';
    });

    await expect(Promise.all([first, second])).resolves.toEqual(['first', 'second']);
    expect(order).toEqual(['first-start', 'first-end', 'second-start']);
    expect(queue.getStats()).toEqual(expect.objectContaining({ active: 0, queued: 0, completed: 2 }));
  });

  it('rejects when the queue is full', async () => {
    const queue = createRenderQueue({ maxConcurrent: 1, maxQueue: 0, queueTimeoutMs: 2000 });

    const first = queue.enqueue(() => delay(30));
    await expect(queue.enqueue(() => Promise.resolve('overflow'))).rejects.toMatchObject({ code: 'PDF_RENDER_QUEUE_FULL' });
    await first;
    expect(queue.getStats().rejected).toBe(1);
  });
});

import { Worker } from 'bullmq';
import { acquireBrowser, releaseBrowser } from './utils/browserPool.js';
import { handleGforms } from './automation/gforms.js';
import { handleQuizizz } from './automation/quizizz.js';
import { handleSpringboard } from './automation/springboard.js';
import { getClient, removeClient } from './utils/jobQueue.js';
import { startStreaming } from './utils/streamer.js';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined
};

const worker = new Worker('automation', async (job) => {
  const { platform, url, userInfo } = job.data;
  const ws = getClient(job.id);
  if (!ws) {
    console.error(`[Worker] Job ${job.id} aborted (no WS client)`);
    return;
  }

  const browserInstance = await acquireBrowser();
  let streamInterval = null;
  let confirmResolve = null;
  let stopRequested = false;

  try {
    const page = await browserInstance.context.newPage();
    const send = (type, data) => {
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type, data }));
    };

    const waitForConfirm = () =>
      new Promise((resolve) => {
        confirmResolve = resolve;
        send('confirmation_required', true);
        send('status', 'Paused — press Confirm Submit when ready.');
      });

    // Handle incoming messages for this job
    ws.on('message', (raw) => {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }
      if (msg.command === 'stop') {
        stopRequested = true;
        if (confirmResolve) confirmResolve('stop');
      }
      if (msg.command === 'confirm') {
        if (confirmResolve) { confirmResolve('confirm'); confirmResolve = null; }
        send('confirmation_required', false);
      }
    });

    streamInterval = startStreaming(page, ws);
    const ctx = { page, ws, send, waitForConfirm, isStop: () => stopRequested };
    
    if (platform === 'gforms') await handleGforms(ctx, url, userInfo);
    if (platform === 'quizizz') await handleQuizizz(ctx, url);
    if (platform === 'springboard') await handleSpringboard(ctx, url);
    
    await page.close();
  } finally {
    if (streamInterval) clearInterval(streamInterval);
    releaseBrowser(browserInstance);
    removeClient(job.id);
  }
}, { connection, concurrency: 3 });

worker.on('completed', job => console.log(`[Worker] Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`[Worker] Job ${job.id} failed:`, err.message));

export default worker;

import express from 'express';
import { WebSocketServer } from 'ws';
import { chromium } from 'playwright';
import { startStreaming } from './utils/streamer.js';
import { handleGforms } from './automation/gforms.js';
import { handleQuizizz } from './automation/quizizz.js';
import { handleSpringboard } from './automation/springboard.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const server = app.listen(process.env.PORT || 3001, () => {
  console.log(`Backend listening on port ${process.env.PORT || 3001}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('[WS] Client connected');

  // Session-scoped state (no DB, no file writes)
  let browser = null;
  let streamInterval = null;
  let confirmResolve = null;
  let stopRequested = false;

  // Helpers
  const send = (type, data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type, data }));
    }
  };

  const waitForConfirm = () =>
    new Promise((resolve) => {
      confirmResolve = resolve;
      send('confirmation_required', true);
      send('status', 'Paused — press Confirm Submit when ready.');
    });

  ws.on('message', async (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.command === 'stop') {
      stopRequested = true;
      if (confirmResolve) confirmResolve('stop');
      send('status', 'Stopping...');
      if (streamInterval) clearInterval(streamInterval);
      if (browser) { await browser.close(); browser = null; }
      send('status', 'Stopped.');
      return;
    }

    if (msg.command === 'confirm') {
      if (confirmResolve) { confirmResolve('confirm'); confirmResolve = null; }
      send('confirmation_required', false);
      return;
    }

    if (msg.command === 'start') {
      const { platform, url, userInfo } = msg;
      stopRequested = false;

      try {
        browser = await chromium.launch({ headless: false });
        const context = await browser.newContext();
        const page = await context.newPage();

        streamInterval = startStreaming(page, ws);

        const ctx = { page, ws, send, waitForConfirm, isStop: () => stopRequested };

        if (platform === 'gforms')      await handleGforms(ctx, url, userInfo);
        if (platform === 'quizizz')     await handleQuizizz(ctx, url);
        if (platform === 'springboard') await handleSpringboard(ctx, url);

      } catch (err) {
        console.error('[Automation error]', err);
        send('error', err.message || String(err));
      } finally {
        if (streamInterval) { clearInterval(streamInterval); streamInterval = null; }
        if (browser) { await browser.close(); browser = null; }
      }
    }
  });

  ws.on('close', async () => {
    console.log('[WS] Client disconnected — wiping session');
    stopRequested = true;
    if (streamInterval) clearInterval(streamInterval);
    if (browser) { try { await browser.close(); } catch {} browser = null; }
  });
});

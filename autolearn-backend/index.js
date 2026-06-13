import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import dotenv from 'dotenv';
import { initPool } from './utils/browserPool.js';
import { enqueueJob } from './utils/jobQueue.js';
import { checkRateLimit } from './utils/rateLimiter.js';
import './worker.js';

dotenv.config();

const app = express();
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  console.log('[WS] Client connected');

  ws.on('message', async (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.command === 'start') {
      const { platform, url, userInfo } = msg;

      const userKey = userInfo?.roll || req.socket.remoteAddress;
      const allowed = await checkRateLimit(userKey);

      if (!allowed) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Too many requests. Wait 1 minute before retrying.'
        }));
        return;
      }

      const safeInfo = { ...userInfo, password: '[REDACTED]' };
      console.log('[Job] Starting with user:', safeInfo);

      try {
        await enqueueJob({ platform, url, userInfo }, ws);
      } catch (err) {
        console.error('[Queue Error]', err);
        ws.send(JSON.stringify({ type: 'error', message: 'Failed to enqueue job' }));
      }
    }
  });

  ws.on('close', () => {
    console.log('[WS] Client disconnected');
  });
});

(async () => {
  await initPool();
  server.listen(process.env.PORT || 3001, '0.0.0.0', () => {
    console.log(`[Server] Backend listening on port ${process.env.PORT || 3001}`);
  });
})();

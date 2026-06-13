import { Queue, Worker } from 'bullmq';
import redis from './redisClient.js';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined
};

export const automationQueue = new Queue('automation', { connection });

const activeClients = new Map(); 
// jobId -> ws, to send position updates

export async function enqueueJob(jobData, ws) {
  const job = await automationQueue.add('run', jobData, {
    attempts: 1,
    removeOnComplete: true,
    removeOnFail: true
  });

  activeClients.set(job.id, ws);
  console.log(`[Queue] Job ${job.id} added`);

  // Send position to user
  const waiting = await automationQueue.getWaitingCount();
  ws.send(JSON.stringify({
    type: 'queue',
    jobId: job.id,
    position: waiting,
    message: waiting <= 1
      ? 'Starting now...'
      : `You are #${waiting} in queue. \n         Estimated wait: ${(waiting - 1) * 35} seconds`
  }));

  return job.id;
}

export function getClient(jobId) {
  return activeClients.get(jobId);
}

export function removeClient(jobId) {
  activeClients.delete(jobId);
}

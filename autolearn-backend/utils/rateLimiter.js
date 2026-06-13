import redis from './redisClient.js';

const MAX_JOBS = 3;
const WINDOW = 60; // seconds

export async function checkRateLimit(userKey) {
  const key = `ratelimit:${userKey}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, WINDOW);
  }
  return count <= MAX_JOBS;
}

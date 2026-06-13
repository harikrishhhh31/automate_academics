import redis from './redisClient.js';

const CACHE_TTL = 3 * 60 * 60; // 3 hours in seconds

function cacheKey(url) {
  return `answers:${url}`;
}

export async function getCached(url) {
  try {
    const data = await redis.get(cacheKey(url));
    if (data) {
      console.log('[Cache] Hit for:', url);
      return JSON.parse(data);
    }
    return null;
  } catch (err) {
    console.error('[Cache] Get error:', err.message);
    return null;
  }
}

export async function setCache(url, answers) {
  try {
    await redis.set(
      cacheKey(url), 
      JSON.stringify(answers), 
      'EX', 
      CACHE_TTL
    );
    console.log('[Cache] Stored answers for:', url);
  } catch (err) {
    console.error('[Cache] Set error:', err.message);
  }
}

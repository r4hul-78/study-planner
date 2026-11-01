/**
 * In-memory sliding window rate limiter for expensive AI API endpoints.
 */
export function createRateLimiter(maxRequests = 30, windowMs = 60 * 1000) {
  const ipHits = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const now = Date.now();

    let timestamps = ipHits.get(ip) || [];
    timestamps = timestamps.filter(t => now - t < windowMs);

    if (timestamps.length >= maxRequests) {
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many AI requests. Please wait a minute before trying again.'
        }
      });
    }

    timestamps.push(now);
    ipHits.set(ip, timestamps);
    next();
  };
}

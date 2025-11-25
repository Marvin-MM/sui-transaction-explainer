import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export async function rateLimit(
  identifier: string,
  limit = 10,
  windowSeconds = 60,
): Promise<{ success: boolean; remaining: number }> {
  const key = `ratelimit:${identifier}`
  const current = await redis.incr(key)

  if (current === 1) {
    await redis.expire(key, windowSeconds)
  }

  const remaining = Math.max(0, limit - current)

  return {
    success: current <= limit,
    remaining,
  }
}

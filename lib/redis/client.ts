import { Redis } from "@upstash/redis"

let redisInstance: Redis | null = null

export function getRedisClient(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    })
  }
  return redisInstance
}

export async function cacheData(key: string, data: unknown, ttlSeconds = 3600): Promise<void> {
  const redis = getRedisClient()
  await redis.setex(key, ttlSeconds, JSON.stringify(data))
}

export async function getCachedData(key: string): Promise<unknown | null> {
  const redis = getRedisClient()
  const data = await redis.get(key)
  if (data == null) return null
  if (typeof data === "string") {
    try {
      return JSON.parse(data)
    } catch {
      // Bad string (e.g., "[object Object]") – delete and treat as cache miss
      await redis.del(key)
      return null
    }
  }
  return data
}

export async function deleteCachedData(key: string): Promise<void> {
  const redis = getRedisClient()
  await redis.del(key)
}

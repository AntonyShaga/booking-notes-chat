import type { Redis as RedisClient } from "ioredis";
import { TRPCError } from "@trpc/server";

export const checkRateLimit = async (
  redis: RedisClient,
  key: string,
  maxAttempts = 5,
  ttl = 300
) => {
  const type = await redis.type(key);

  if (type !== "none" && type !== "string") {
    console.warn(`[RateLimit] Redis key "${key}" has invalid type: ${type}`);

    await redis.del(key);
  }

  const attempts = await redis.incr(key);

  if (attempts === 1) {
    await redis.expire(key, ttl);
  }

  if (attempts > maxAttempts) {
    console.warn(`[RateLimit] Too many attempts for key: ${key}`);
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Превышено количество попыток. Попробуйте позже.",
    });
  }
};

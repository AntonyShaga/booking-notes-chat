import type { Redis as RedisClient } from "ioredis";
import { TRPCError } from "@trpc/server";

export const checkRateLimit = async (
  redis: RedisClient,
  key: string,
  maxAttempts = 5,
  ttl = 300
) => {
  const attempts = await redis.incr(key);

  if (attempts === 1) {
    // Устанавливаем TTL только при первом запросе
    await redis.expire(key, ttl);
  }

  if (attempts > maxAttempts) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Превышено количество попыток. Попробуйте позже.",
    });
  }
};

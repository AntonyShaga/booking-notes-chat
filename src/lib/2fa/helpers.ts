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
    // Предупреждение для дебага
    console.warn(`[RateLimit] Redis key "${key}" has invalid type: ${type}`);
    // Удаляем неправильный тип
    await redis.del(key);
  }

  const attempts = await redis.incr(key);

  if (attempts === 1) {
    await redis.expire(key, ttl);
  }

  if (attempts > maxAttempts) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Превышено количество попыток. Попробуйте позже.",
    });
  }
};

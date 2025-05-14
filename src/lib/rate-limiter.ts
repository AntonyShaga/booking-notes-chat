import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Проверка обязательных переменных окружения
if (!process.env.REDIS_PUBLIC_URL || !process.env.REDIS_PASSWORD) {
  throw new Error(
    "Redis configuration is missing. Please set REDIS_PUBLIC_URL and REDIS_PASSWORD environment variables."
  );
}

export const redis = new Redis({
  url: process.env.REDIS_PUBLIC_URL,
  token: process.env.REDIS_PASSWORD,
});

// Конфигурация rate-limiting
export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
  analytics: true, // Включение аналитики (опционально)
  prefix: "@upstash/ratelimit", // Префикс для ключей в Redis
});

// Тестовое подключение к Redis (опционально, для проверки)
async function testRedisConnection() {
  try {
    const pong = await redis.ping();
    console.log("Redis connection successful:", pong);
  } catch (error) {
    console.error("Redis connection failed:", error);
    throw error;
  }
}

// Вызываем при инициализации (в dev-режиме)
if (process.env.NODE_ENV === "development") {
  testRedisConnection().catch(console.error);
}

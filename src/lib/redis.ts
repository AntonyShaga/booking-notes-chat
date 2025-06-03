// lib/redis.ts
import Redis from "ioredis";

// Убедись, что URL задан
if (!process.env.REDIS_PUBLIC_URL) {
  throw new Error("REDIS_PUBLIC_URL is required");
}

// Инициализация Redis клиента
export const redis = new Redis(process.env.REDIS_PUBLIC_URL, {
  // Для Upstash ничего кроме URL не нужно
  maxRetriesPerRequest: 3,
  connectTimeout: 5000,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

// Проверка соединения в dev
if (process.env.NODE_ENV === "development") {
  redis
    .ping()
    .then(() => console.log("✅ Redis connected to Upstash"))
    .catch((err) => console.error("❌ Redis connection failed:", err));
}

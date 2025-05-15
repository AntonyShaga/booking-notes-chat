// lib/redis.ts
import Redis from "ioredis";

// Проверяем обязательные переменные окружения
if (!process.env.REDIS_PUBLIC_URL) {
  throw new Error("REDIS_PUBLIC_URL environment variable is required");
}

// Инициализируем Redis клиент
export const redis = new Redis(process.env.REDIS_PUBLIC_URL, {
  // Пароль (если требуется)
  password: process.env.REDIS_PASSWORD,

  // Настройка TLS для secure соединений (rediss://)
  tls: process.env.REDIS_PUBLIC_URL.startsWith("rediss://") ? {} : undefined,

  // Дополнительные опции (по желанию)
  connectTimeout: 5000,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

// Опционально: тест подключения в dev-режиме
if (process.env.NODE_ENV === "development") {
  redis
    .ping()
    .then(() => console.log("✅ Redis connection established"))
    .catch((err) => console.error("❌ Redis connection failed:", err));
}

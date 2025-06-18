import Redis from "ioredis";

if (!process.env.REDIS_PUBLIC_URL) {
  throw new Error("REDIS_PUBLIC_URL is required");
}

export const redis = new Redis(process.env.REDIS_PUBLIC_URL, {
  maxRetriesPerRequest: 3,
  connectTimeout: 5000,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

if (process.env.NODE_ENV === "development") {
  redis
    .ping()
    .then(() => console.log("✅ Redis connected to Upstash"))
    .catch((err) => console.error("❌ Redis connection failed:", err));
}

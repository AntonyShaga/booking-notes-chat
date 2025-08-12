import { TRPCError } from "@trpc/server";
import { generateEmailToken, generateOTPSecret } from "./generate";
import { redisKeys } from "./redis";
import { checkRateLimit } from "./helpers";
import type { Redis as RedisClient } from "ioredis";

const COOLDOWN_SECONDS = 60;
const CODE_TTL_SECONDS = 300;

export async function startEmail2FA({
  redis,
  user,
  sendEmail,
}: {
  redis: RedisClient;
  user: { id: string; email: string };
  sendEmail: (opts: {
    to: string;
    subject: string;
    token: string;
    type: "two-factor-page" | "verify";
  }) => Promise<void>;
}) {
  const cooldownKey = redisKeys.cooldown(user.id);
  const pendingKey = redisKeys.pending(user.id);
  const attemptsKey = redisKeys.attempts(user.id);

  // 🛡️ Protection against frequent attempts
  await checkRateLimit(redis, attemptsKey);

  // 🕒 Cooldown between send attempts
  const isOnCooldown = await redis.exists(cooldownKey);
  if (isOnCooldown) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Please wait before sending the code again",
    });
  }

  const secret = generateOTPSecret();
  const token = await generateEmailToken(secret);

  await redis.hset(pendingKey, { method: "email", token, secret });

  await redis.expire(pendingKey, CODE_TTL_SECONDS);

  await redis.setex(cooldownKey, COOLDOWN_SECONDS, "1");

  await sendEmail({
    to: user.email,
    subject: "Your 2FA verification code",
    token,
    type: "two-factor-page",
  });

  return { method: "email" };
}

export async function verifyEmail2FA({
  redis,
  userId,
  code,
}: {
  redis: RedisClient;
  userId: string;
  code: string;
}): Promise<{ success: true; secret: string }> {
  const pendingKey = redisKeys.pending(userId);

  const data = await redis.hgetall(pendingKey);

  if (!data?.token || data.method !== "email") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Please request the email code first",
    });
  }

  if (data.token !== code) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid verification code",
    });
  }

  await redis.del(pendingKey);

  return { success: true, secret: data.secret };
}

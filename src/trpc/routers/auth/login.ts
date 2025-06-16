import { publicProcedure } from "@/trpc/trpc";
import { loginSchema } from "@/shared/validations/auth";
import { TRPCError } from "@trpc/server";
import argon2 from "argon2";
import { generateTokens } from "@/lib/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";
import { redisKeys } from "@/lib/2fa/redis";
import { checkRateLimit } from "@/lib/2fa/helpers";

export const login = publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
  const user = await ctx.prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      password: true,
      isActive: true,
      twoFactorEnabled: true,
    },
  });

  const identifier =
    ctx.req.headers.get("x-real-ip") || ctx.req.headers.get("x-forwarded-for") || "local";

  const rateLimitKey = redisKeys.loginRateLimit(identifier);
  await checkRateLimit(ctx.redis, rateLimitKey, 5, 10);

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Пользователь с таким email не найден",
    });
  }

  if (!user.isActive) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Учетная запись неактивна. Подтвердите почту.",
    });
  }

  if (!user.password) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Аккаунт зарегистрирован через Google. Войдите через Google.",
    });
  }

  const isPasswordCorrect = await argon2.verify(user.password, input.password);
  if (!isPasswordCorrect) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Неверный пароль",
    });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Ошибка конфигурации сервера",
    });
  }

  if (user.twoFactorEnabled) {
    const twoFactorStatusKey = redisKeys.twoFactorStatus(user.id);
    await ctx.redis.set(twoFactorStatusKey, "waiting", "EX", 300);
    return { requires2FA: true, userId: user.id };
  }

  const { tokenId, refreshJwt, accessJwt } = await generateTokens(user.id);
  await setAuthCookies(accessJwt, refreshJwt);

  try {
    await ctx.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        updatedAt: new Date(),
        activeRefreshTokens: { push: tokenId },
      },
    });
  } catch (error) {
    console.error("Ошибка обновления lastLogin:", error);
  }

  return { message: "Вход выполнен успешно", userId: user.id };
});

export const loginRouter = { login };

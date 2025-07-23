import { publicProcedure } from "@/trpc/trpc";
import { loginSchema } from "@/shared/validations/auth";
import { TRPCError } from "@trpc/server";
import argon2 from "argon2";
import { generateTokens } from "@/lib/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";
import { redisKeys } from "@/lib/2fa/redis";
import { checkRateLimit } from "@/lib/2fa/helpers";
import { getTranslation } from "@/lib/errors/messages";

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
      message: getTranslation(ctx.lang, "login.userNotFound"),
    });
  }

  if (!user.isActive) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: getTranslation(ctx.lang, "login.accountNotActive"),
    });
  }

  if (!user.password) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: getTranslation(ctx.lang, "login.oauthOnly"),
    });
  }

  const isPasswordCorrect = await argon2.verify(user.password, input.password);
  if (!isPasswordCorrect) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: getTranslation(ctx.lang, "login.invalidCredentials"),
    });
  }

  if (user.twoFactorEnabled) {
    const twoFactorStatusKey = redisKeys.twoFactorStatus(user.id);
    await ctx.redis.set(twoFactorStatusKey, "waiting", "EX", 300);
    return { requires2FA: true, userId: user.id };
  }

  const { tokenId, refreshJwt, accessJwt } = await generateTokens(user.id, ctx.prisma);

  try {
    await ctx.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
          updatedAt: new Date(),
          activeRefreshTokens: { push: tokenId },
        },
      });
    });
    await setAuthCookies(accessJwt, refreshJwt);
    return { message: "Вход выполнен успешно", userId: user.id };
  } catch (error) {
    console.error(getTranslation(ctx.lang, "login.lastLoginUpdateError"), error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: getTranslation(ctx.lang, "login.serverConfigError"),
    });
  }
});

export const loginRouter = { login };

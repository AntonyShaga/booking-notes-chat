import { publicProcedure } from "@/trpc/trpc";
import { loginSchema } from "@/shared/validations/auth";
import { TRPCError } from "@trpc/server";
import argon2 from "argon2";
import { generateTokens } from "@/lib/jwt";
import { redisKeys } from "@/lib/2fa/redis";
import { checkRateLimit } from "@/lib/2fa/helpers";
import { getTranslation } from "@/lib/errors/messages";
import { updateUserLoginAndSetCookies } from "@/lib/auth/updateUserLogin";

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

  await updateUserLoginAndSetCookies({
    userId: user.id,
    tokenId,
    accessJwt,
    refreshJwt,
    prisma: ctx.prisma,
    lang: ctx.lang,
  });

  return { message: "Вход выполнен успешно", userId: user.id };
});

export const loginRouter = { login };

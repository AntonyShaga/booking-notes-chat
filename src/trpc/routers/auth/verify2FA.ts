import { publicProcedure } from "@/trpc/trpc";
import { redisKeys } from "@/lib/2fa/redis";
import { TRPCError } from "@trpc/server";
import { verifyEmail2FA } from "@/lib/2fa/email";
import { authenticator } from "otplib";
import { generateTokens } from "@/lib/jwt";
import { verify2FAAfterLoginSchema } from "@/shared/validations/auth";
import { getTranslation } from "@/lib/errors/messages";
import { updateUserLoginAndSetCookies } from "@/lib/auth/updateUserLogin";

export const verify2FAAfterLogin = publicProcedure
  .input(verify2FAAfterLoginSchema)
  .mutation(async ({ input, ctx }) => {
    const { code, method, userId } = input;
    const redisKey = redisKeys.pending(userId);

    const pending = await ctx.redis.hgetall(redisKey);
    if (!pending) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: getTranslation(ctx.lang, "verify2FA.sessionExpired"),
      });
    }

    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        twoFactorSecret: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: getTranslation(ctx.lang, "verify2FA.userNotFound"),
      });
    }
    if (!user.isActive) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: getTranslation(ctx.lang, "verify2FA.accountNotActive"),
      });
    }
    if (method === "email") {
      await verifyEmail2FA({
        redis: ctx.redis,
        userId: userId,
        code,
      });
    }

    if (method === "qr" || method === "manual") {
      if (!user.twoFactorSecret) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: getTranslation(ctx.lang, "verify2FA.notConfigured"),
        });
      }

      const isValid = authenticator.check(code, user.twoFactorSecret);
      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: getTranslation(ctx.lang, "verify2FA.invalidCode"),
        });
      }
    }

    await ctx.redis.del(redisKey);

    const { tokenId, refreshJwt, accessJwt } = await generateTokens(user.id, ctx.prisma);

    await updateUserLoginAndSetCookies({
      userId: user.id,
      tokenId,
      accessJwt,
      refreshJwt,
      prisma: ctx.prisma,
      lang: ctx.lang,
    });
    return {
      message: "2FA подтверждена. Вход выполнен.",
      userId: user.id,
    };
  });

export const verify2FARouter = { verify2FAAfterLogin };

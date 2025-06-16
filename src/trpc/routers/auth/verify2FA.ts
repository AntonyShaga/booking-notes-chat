import { publicProcedure } from "@/trpc/trpc";
import { redisKeys } from "@/lib/2fa/redis";
import { TRPCError } from "@trpc/server";
import { verifyEmail2FA } from "@/lib/2fa/email";
import { authenticator } from "otplib";
import { generateTokens } from "@/lib/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";
import { verify2FAAfterLoginSchema } from "@/shared/validations/auth";

export const verify2FAAfterLogin = publicProcedure
  .input(verify2FAAfterLoginSchema)
  .mutation(async ({ input, ctx }) => {
    const { code, method, userId } = input;
    const redisKey = redisKeys.pending(userId);

    const pending = await ctx.redis.hgetall(redisKey);
    if (!pending) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Сессия подтверждения 2FA истекла или недействительна",
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
        message: "Пользователь не найден",
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
          message: "2FA не настроена",
        });
      }

      const isValid = authenticator.check(code, user.twoFactorSecret);
      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Неверный код 2FA",
        });
      }
    }

    // Всё ок, удаляем redis ключ и авторизуем
    await ctx.redis.del(redisKey);

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

    return {
      message: "2FA подтверждена. Вход выполнен.",
      userId: user.id,
    };
  });

export const verify2FARouter = { verify2FAAfterLogin };

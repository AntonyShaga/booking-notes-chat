import { publicProcedure } from "@/trpc/trpc";
import { request2FASchema, TwoFAOutputSchema } from "@/shared/validations/2fa";
import { TRPCError } from "@trpc/server";
import { redisKeys } from "@/lib/2fa/redis";
import { checkRateLimit } from "@/lib/2fa/helpers";
import { startEmail2FA } from "@/lib/2fa/email";

export const request2FA = publicProcedure
  .input(request2FASchema)
  .output(TwoFAOutputSchema)
  .mutation(async ({ ctx, input }) => {
    const { userId, method } = input;

    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    if (!user || !user.twoFactorEnabled) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "2FA не включена или пользователь не найден",
      });
    }

    const attemptsKey = redisKeys.attempts(userId);

    await checkRateLimit(ctx.redis, attemptsKey);
    await ctx.redis.del(attemptsKey);

    if (method === "email") {
      await startEmail2FA({
        redis: ctx.redis,
        user: { id: userId, email: user.email },
        sendEmail: ctx.sendEmail,
      });

      return { method: "email" };
    }

    if (method === "qr") {
      return {
        method: "qr",
        message: "Откройте приложение Google Authenticator и введите код",
      };
    }

    if (method === "manual") {
      return {
        method: "manual",
        message: "Введите код из приложения, с которым вы настраивали 2FA",
      };
    }

    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Неверный метод 2FA",
    });
  });
export const requestRouter = { request2FA };

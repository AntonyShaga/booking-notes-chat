import { protectedProcedure } from "@/trpc/trpc";
import { enable2FAResponseSchema, enable2FASchema } from "@/shared/validations/2fa";
import { redisKeys } from "@/lib/2fa/redis";
import { checkRateLimit } from "@/lib/2fa/helpers";
import { TRPCError } from "@trpc/server";
import { generateOTPSecret, generateQRCode } from "@/lib/2fa/generate";
import { startEmail2FA } from "@/lib/2fa/email";

export const enable2FA = protectedProcedure
  .input(enable2FASchema)
  .output(enable2FAResponseSchema)
  .mutation(async ({ ctx, input }) => {
    const { method } = input;
    const { user } = ctx.session;

    const attemptsKey = redisKeys.attempts(user.id);

    await checkRateLimit(ctx.redis, attemptsKey);

    const currentUser = await ctx.prisma.user.findUnique({
      where: { id: user.id },
      select: { twoFactorEnabled: true },
    });

    if (currentUser?.twoFactorEnabled) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "2FA уже включена. Сначала отключите её.",
      });
    }

    // Очистка прошлых данных
    await ctx.redis.del(attemptsKey);
    await ctx.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: null, twoFactorEnabled: false },
    });

    if (method === "qr" || method === "manual") {
      const secret = generateOTPSecret();
      const { qrCode } = await generateQRCode(user.email, "YourApp", secret);

      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { twoFactorSecret: secret },
      });

      return method === "qr" ? { method, qrCode } : { method, secret };
    }

    if (method === "email") {
      await startEmail2FA({
        redis: ctx.redis,
        user,
        sendEmail: ctx.sendEmail,
      });
      return { method: "email" };
    }

    throw new TRPCError({ code: "BAD_REQUEST", message: "Неверный метод 2FA" });
  });
export const setupRouter = { enable2FA };

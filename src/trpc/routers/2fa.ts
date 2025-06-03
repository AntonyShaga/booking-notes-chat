import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { generateOTPSecret, generateQRCode } from "@/lib/2fa/generate";
import { redisKeys } from "@/lib/2fa/redis";
import { checkRateLimit } from "@/lib/2fa/helpers";
import { startEmail2FA, verifyEmail2FA } from "@/lib/2fa/email";
import { validateOTPCode } from "@/lib/2fa/validate";

export const twoFARouter = router({
  enable2FA: protectedProcedure
    .input(z.object({ method: z.enum(["qr", "manual", "email"]) }))
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
        return await startEmail2FA({
          redis: ctx.redis,
          user,
          sendEmail: ctx.sendEmail,
        });
      }

      throw new TRPCError({ code: "BAD_REQUEST", message: "Неверный метод 2FA" });
    }),

  confirm2FASetup: protectedProcedure
    .input(
      z.object({
        code: z.string().length(6).regex(/^\d+$/, "Код должен содержать только цифры"),
        method: z.enum(["qr", "manual", "email"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { code, method } = input;
      const { user } = ctx.session;

      const userData = await ctx.prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!userData) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      if (userData.twoFactorEnabled) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "2FA уже включена",
        });
      }

      if (method === "qr" || method === "manual") {
        if (!userData.twoFactorSecret) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Сначала сгенерируйте секрет",
          });
        }

        const isValid = validateOTPCode(code, userData.twoFactorSecret);
        if (!isValid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Неверный код подтверждения",
          });
        }

        await ctx.prisma.user.update({
          where: { id: user.id },
          data: { twoFactorEnabled: true },
        });

        return { success: true };
      }

      if (method === "email") {
        const result = await verifyEmail2FA({
          redis: ctx.redis,
          userId: user.id,
          code,
        });

        await ctx.prisma.user.update({
          where: { id: user.id },
          data: {
            twoFactorEnabled: true,
            twoFactorSecret: result.secret,
          },
        });

        return { success: true };
      }

      throw new TRPCError({ code: "BAD_REQUEST", message: "Неверный метод подтверждения" });
    }),

  disable2FA: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.user.update({
      where: { id: ctx.session.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return { success: true };
  }),

  get2FAStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { twoFactorEnabled: true },
    });

    return { isEnabled: user?.twoFactorEnabled ?? false };
  }),
});

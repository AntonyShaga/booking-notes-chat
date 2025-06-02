import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { authenticator } from "otplib";
import qrcode from "qrcode";

export const twoFARouter = router({
  enable2FA: protectedProcedure
    .input(
      z.object({
        method: z.enum(["qr", "manual", "email"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { method } = input;
      const { user } = ctx.session;
      const redisKey = `2fa:${user.id}`;

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

      // Очистка предыдущих данных
      await ctx.redis.del(redisKey);
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { twoFactorSecret: null, twoFactorEnabled: false },
      });

      if (method === "qr" || method === "manual") {
        const secret = authenticator.generateSecret();
        const otpauth = authenticator.keyuri(user.email, "YourApp", secret);

        await ctx.prisma.user.update({
          where: { id: user.id },
          data: { twoFactorSecret: secret },
        });

        if (method === "qr") {
          const qrCode = await qrcode.toDataURL(otpauth);
          return { method, qrCode };
        }

        return { method, secret };
      }

      if (method === "email") {
        const secret = authenticator.generateSecret();
        const token = authenticator.generate(secret);

        await ctx.redis.hset(redisKey, {
          method,
          token,
          secret, // Сохраняем секрет для последующей проверки
        });
        await ctx.redis.expire(redisKey, 300);

        await ctx.sendEmail({
          to: user.email,
          subject: "Ваш код для 2FA",
          html: `Ваш код подтверждения: ${token}`,
        });

        return { method };
      }

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Неверный метод 2FA",
      });
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
      const redisKey = `2fa:${user.id}`;

      const userData = await ctx.prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!userData) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      if (method === "qr" || method === "manual") {
        if (!userData.twoFactorSecret) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Сначала сгенерируйте секрет",
          });
        }

        const isValid = authenticator.verify({
          token: code,
          secret: userData.twoFactorSecret,
        });

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
        const redisData = await ctx.redis.hgetall(redisKey);

        if (!redisData?.token || redisData.method !== "email") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Сначала запросите код по email",
          });
        }

        if (redisData.token !== code) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Неверный код подтверждения",
          });
        }

        await ctx.prisma.user.update({
          where: { id: user.id },
          data: {
            twoFactorEnabled: true,
            twoFactorSecret: redisData.secret,
          },
        });

        await ctx.redis.del(redisKey);

        return { success: true };
      }

      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Неверный метод подтверждения",
      });
    }),
  disable2FA: protectedProcedure.mutation(async ({ ctx }) => {
    const { user } = ctx.session;

    await ctx.prisma.user.update({
      where: { id: user.id },
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
      select: {
        twoFactorEnabled: true,
      },
    });

    return { isEnabled: user?.twoFactorEnabled ?? false };
  }),
});

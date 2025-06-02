// src/server/api/routers/twoFA.ts
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { authenticator } from "otplib";
import qrcode from "qrcode";

export const twoFARouter = router({
  enable2FA: protectedProcedure
    .input(z.object({ method: z.enum(["qr", "manual", "email", "sms"]) }))
    .mutation(async ({ ctx, input }) => {
      const { method } = input;
      const userId = ctx.session.user.id;
      const email = ctx.session.user.email;
      const redis = ctx.redis;

      const secret = authenticator.generateSecret();

      if (method === "qr" || method === "manual") {
        await ctx.prisma.user.update({
          where: { id: userId },
          data: { twoFactorSecret: secret, twoFactorEnabled: false },
        });

        const otpauth = authenticator.keyuri(email, "MyApp", secret);

        if (method === "qr") {
          const qrCode = await qrcode.toDataURL(otpauth);
          return { method: "qr", qrCode };
        }

        return { method: "manual", secret };
      }

      if (method === "email") {
        const redisKey = `2fa:${userId}:email`;

        const cooldown = await redis.ttl(redisKey);
        if (cooldown > 0) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Подождите ${cooldown} сек. перед повторной отправкой кода.`,
          });
        }

        const token = authenticator.generate(secret);
        await redis.set(redisKey, token, "EX", 300); // 5 минут

        await ctx.sendEmail({
          to: email,
          subject: "Ваш код 2FA",
          html: `<p>Код: <b>${token}</b></p>`,
        });

        return { method: "email", message: "Код отправлен на почту." };
      }

      throw new TRPCError({ code: "BAD_REQUEST", message: "Метод не поддерживается." });
    }),

  confirm2FASetup: protectedProcedure
    .input(z.object({ code: z.string().min(6).max(6) }))
    .mutation(async ({ ctx, input }) => {
      const { code } = input;
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      });
      const redis = ctx.redis;
      const redisKey = `2fa:${user?.id}:email`;

      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      if (user.twoFactorSecret) {
        const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
        if (!isValid) throw new TRPCError({ code: "BAD_REQUEST", message: "Неверный код." });

        await ctx.prisma.user.update({
          where: { id: user.id },
          data: { twoFactorEnabled: true },
        });

        return { message: "2FA включено!" };
      }

      const savedCode = await redis.get(redisKey);
      if (!savedCode || savedCode !== code) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Неверный или истёкший код." });
      }

      await redis.del(redisKey);

      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { twoFactorEnabled: true },
      });

      return { message: "2FA включено через email!" };
    }),
});

import { protectedProcedure, router } from "../trpc"; // 👈 используешь твой protectedProcedure
import { TRPCError } from "@trpc/server";
import { authenticator } from "otplib";
import qrcode from "qrcode";
import { z } from "zod";

export const twoFARouter = router({
  enable2FA: protectedProcedure
    .input(
      z.object({
        method: z.enum(["qr", "manual", "email", "sms"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const email = ctx.session.user.email;
      const secret = authenticator.generateSecret();

      // Сохраняем секрет независимо от метода
      await ctx.prisma.user.update({
        where: { id: userId },
        data: { twoFactorSecret: secret, twoFactorEnabled: false },
      });

      // Формируем otpauth ссылку
      const otpauth = authenticator.keyuri(email, "MyApp", secret);

      switch (input.method) {
        case "qr": {
          const qrCode = await qrcode.toDataURL(otpauth);
          return {
            method: "qr",
            qrCode,
          };
        }

        case "manual": {
          return {
            method: "manual",
            secret,
          };
        }

        case "email": {
          const token = authenticator.generate(secret); // 6-значный код
          // тут можно подключить Resend/SendGrid/etc
          await ctx.sendEmail({
            to: email,
            subject: "Ваш код подтверждения 2FA",
            html: `<p>Ваш код: <b>${token}</b></p>`,
          });

          return {
            method: "email",
            message: "Код отправлен на вашу почту.",
          };
        }

        /*case "sms": {
          const phone = ctx.session.user.phone;
          if (!phone) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Телефон не указан." });
          }

          const token = authenticator.generate(secret);
          // тут можно подключить Twilio/SMSClub/etc
          await ctx.sendSMS({
            to: phone,
            body: `Ваш код подтверждения: ${token}`,
          });

          return {
            method: "sms",
            message: "Код отправлен по SMS.",
          };
        }
*/
        default:
          throw new TRPCError({ code: "BAD_REQUEST", message: "Неверный метод." });
      }
    }),

  confirm2FASetup: protectedProcedure
    .input(z.object({ code: z.string().min(6).max(6) }))
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (!user?.twoFactorSecret) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Секрет не найден." });
      }

      const isValid = authenticator.verify({
        token: input.code,
        secret: user.twoFactorSecret,
      });

      if (!isValid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Неверный код." });
      }

      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { twoFactorEnabled: true },
      });

      return { message: "2FA успешно включено!" };
    }),
});

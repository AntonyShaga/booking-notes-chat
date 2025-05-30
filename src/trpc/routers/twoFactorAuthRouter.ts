// /server/api/routers/2fa.ts
import { router, protectedProcedure } from "@/trpc/trpc";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { TRPCError } from "@trpc/server";
import z from "zod";

export const twoFaRouter = router({
  generateQRCode: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.session.user;
    const secret = authenticator.generateSecret();

    // URI для Google Authenticator
    const otpauth = authenticator.keyuri(user.email, "MyApp", secret);
    const qrCode = await QRCode.toDataURL(otpauth);

    // сохраняем секрет
    await ctx.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: false, // Активируется позже
      },
    });

    return { qrCode };
  }),

  verify2FA: protectedProcedure
    .input(
      z.object({
        code: z.string().length(6),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (!user?.twoFactorSecret) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "2FA не инициализирована" });
      }

      const isValid = authenticator.check(input.code, user.twoFactorSecret);

      if (!isValid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Неверный код" });
      }

      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { twoFactorEnabled: true },
      });

      return { success: true };
    }),
});

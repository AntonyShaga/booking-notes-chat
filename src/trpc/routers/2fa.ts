// server/api/routers/2fa.ts (или где у тебя роуты)

import { protectedProcedure } from "../trpc"; // 👈 используешь твой protectedProcedure
import { TRPCError } from "@trpc/server";
import { authenticator } from "otplib";
import qrcode from "qrcode";
import { z } from "zod";

export const enable2FA = protectedProcedure.mutation(async ({ ctx }) => {
  const userId = ctx.session.user.id;

  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(ctx.session.user.email, "MyApp", secret);
  const qrCode = await qrcode.toDataURL(otpauth);

  await ctx.prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret },
  });

  return { qrCode };
});

export const confirm2FASetup = protectedProcedure
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
  });

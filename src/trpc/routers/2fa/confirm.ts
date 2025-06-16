import { protectedProcedure, router } from "@/trpc/trpc";
import { confirm2FASchema } from "@/shared/validations/2fa";
import { TRPCError } from "@trpc/server";
import { validateOTPCode } from "@/lib/2fa/validate";
import { verifyEmail2FA } from "@/lib/2fa/email";

export const confirm2FASetup = protectedProcedure
  .input(confirm2FASchema)
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
  });

export const confirmRouter = {
  confirm2FASetup,
};

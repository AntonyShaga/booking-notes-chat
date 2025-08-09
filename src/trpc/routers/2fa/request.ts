import { publicProcedure } from "@/trpc/trpc";
import { request2FASchema, TwoFAOutputSchema } from "@/shared/validations/2fa";
import { TRPCError } from "@trpc/server";
import { redisKeys } from "@/lib/2fa/redis";
import { checkRateLimit } from "@/lib/2fa/helpers";
import { startEmail2FA } from "@/lib/2fa/email";
import { getTranslation } from "@/lib/errors/messages";

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

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: getTranslation(ctx.lang, "errors.request2FA.userNotFound"),
      });
    }

    if (!user.twoFactorEnabled) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: getTranslation(ctx.lang, "errors.request2FA.twoFANotEnabled"),
      });
    }

    const attemptsKey = redisKeys.attempts(userId);

    await checkRateLimit(ctx.redis, attemptsKey);

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
        message: getTranslation(ctx.lang, "errors.request2FA.qrInstruction"),
      };
    }

    if (method === "manual") {
      return {
        method: "manual",
        message: getTranslation(ctx.lang, "errors.request2FA.manualInstruction"),
      };
    }

    throw new TRPCError({
      code: "BAD_REQUEST",
      message: getTranslation(ctx.lang, "errors.request2FA.invalidMethod"),
    });
  });
export const requestRouter = { request2FA };

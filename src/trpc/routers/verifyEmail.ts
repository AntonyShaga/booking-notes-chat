import { protectedProcedure, router } from "@/trpc/trpc";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { redis } from "@/lib/redis";
import { addHours } from "date-fns";
import { generateTokenId } from "@/lib/jwt";
import { redisKeys } from "@/lib/2fa/redis";
import { checkRateLimit } from "@/lib/2fa/helpers";
import { getTranslation } from "@/lib/errors/messages";

export const verifyEmailRouter = router({
  verifyEmail: protectedProcedure
    .input(z.object({ token: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findFirst({
        where: { verificationToken: input.token },
      });
      if (!user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: getTranslation(ctx.lang, "errors.verifyEmail.invalidToken"),
        });
      }

      if (!user.isActive) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: getTranslation(ctx.lang, "errors.verifyEmail.accountDeactivated"),
        });
      }

      if (user.verificationTokenExpires && new Date() > user.verificationTokenExpires) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: getTranslation(ctx.lang, "errors.verifyEmail.tokenExpired"),
        });
      }

      if (user.emailVerified) {
        return { message: getTranslation(ctx.lang, "errors.verifyEmail.alreadyVerified") };
      }

      await ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpires: null,
        },
      });

      return { message: getTranslation(ctx.lang, "errors.verifyEmail.alreadyVerified") };
    }),
  resendVerificationEmail: protectedProcedure
    .output(z.object({ success: z.boolean(), message: z.string() }))
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      const email = ctx.session.user.email;

      if (!email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: getTranslation(ctx.lang, "errors.verifyEmail.emailMissingInSession"),
        });
      }

      await checkRateLimit(redis, redisKeys.resendVerificationRateLimit(userId), 3, 3600);

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, emailVerified: true, isActive: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: getTranslation(ctx.lang, "errors.verifyEmail.userNotFound"),
        });
      }

      if (user.emailVerified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: getTranslation(ctx.lang, "errors.verifyEmail.alreadyVerifiedResend"),
        });
      }

      if (!user.isActive) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: getTranslation(ctx.lang, "errors.verifyEmail.accountDeactivated"),
        });
      }

      const newToken = generateTokenId();
      const expiresAt = addHours(new Date(), 24);

      await ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          verificationToken: newToken,
          verificationTokenExpires: expiresAt,
        },
      });

      try {
        ctx.sendEmail({
          to: email,
          subject: "Подтвердите ваш email",
          token: newToken,
        });

        console.log(`[VERIFY_EMAIL] Письмо отправлено: ${email}`);

        return { success: true, message: "Письмо отправлено!" };
      } catch (error) {
        console.error(getTranslation(ctx.lang, "errors.email.resendErrorLog"), error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: getTranslation(ctx.lang, "errors.email.sendError"),
        });
      }
    }),
});

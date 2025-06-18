import { protectedProcedure, router } from "@/trpc/trpc";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { redis } from "@/lib/redis";
import { addHours } from "date-fns";
import { generateTokenId } from "@/lib/jwt";
import { redisKeys } from "@/lib/2fa/redis";
import { checkRateLimit } from "@/lib/2fa/helpers";

export const verifyEmailRouter = router({
  verifyEmail: protectedProcedure
    .input(z.object({ token: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findFirst({
        where: { verificationToken: input.token },
      });
      if (!user) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Недействительный токен" });
      }

      if (!user.isActive) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Учётная запись деактивирована",
        });
      }

      if (user.verificationTokenExpires && new Date() > user.verificationTokenExpires) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Срок действия токена истёк. Запросите новый.",
        });
      }

      if (user.emailVerified) {
        return { message: "Email уже подтверждён." };
      }

      await ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpires: null,
        },
      });

      return { message: "Email успешно подтверждён" };
    }),
  resendVerificationEmail: protectedProcedure
    .output(z.object({ success: z.boolean(), message: z.string() }))
    .mutation(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      const email = ctx.session.user.email;

      if (!email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email отсутствует в сессии пользователя",
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
          message: "Пользователь с таким email не найден",
        });
      }

      if (user.emailVerified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email уже подтверждён. Письмо не будет отправлено повторно.",
        });
      }

      if (!user.isActive) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Учётная запись деактивирована",
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
          html: `
          <p>Для подтверждения email перейдите по ссылке:</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${newToken}">
            Подтвердить Email
          </a>
          <p>Ссылка действительна 24 часа.</p>
        `,
        });

        console.log(`[VERIFY_EMAIL] Письмо отправлено: ${email}`);

        return { success: true, message: "Письмо отправлено!" };
      } catch (error) {
        console.error("[VERIFY_EMAIL] Ошибка отправки:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось отправить письмо",
        });
      }
    }),
});

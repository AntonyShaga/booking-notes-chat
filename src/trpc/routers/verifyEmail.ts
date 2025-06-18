import { protectedProcedure, router } from "@/trpc/trpc";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { redis } from "@/lib/redis";
import { randomUUID } from "node:crypto";
import { addHours } from "date-fns";

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

      const cooldownKey = `resend:cooldown:${userId}`;
      const isOnCooldown = await redis.get(cooldownKey);

      if (isOnCooldown) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Пожалуйста, подождите немного перед повторной отправкой письма.",
        });
      }

      // Устанавливаем cooldown (TTL 30 сек)
      await redis.set(cooldownKey, "1", "EX", 30);

      // 🧪 Rate-limiting (3 письма в час)
      const rateLimitKey = `rate_limit:resend:${userId}`;
      const currentCount = await redis.incr(rateLimitKey);
      if (currentCount > 3) {
        const ttl = await redis.ttl(rateLimitKey);
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Слишком много запросов. Попробуйте через ${ttl} секунд.`,
        });
      }
      await redis.expire(rateLimitKey, 3600); // 1 час TTL

      // 🔍 Проверяем пользователя
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

      // ✉️ Генерация токена и отправка письма
      const newToken = randomUUID();
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

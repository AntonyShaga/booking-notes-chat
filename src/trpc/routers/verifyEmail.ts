import { publicProcedure, router } from "@/trpc/trpc";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { redis } from "@/lib/redis";
import { randomUUID } from "node:crypto";
import { addHours } from "date-fns";
import { resend } from "@/lib/resend";
export const verifyEmailRouter = router({
  verifyEmail: publicProcedure
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

      return { message: "Email успешно подтверждён" }; // 6
    }),
  resendVerificationEmail: publicProcedure.mutation(async ({ ctx }) => {
    // Явная проверка с кастомной ошибкой
    if (!ctx.user?.email) {
      // Проверяем и user, и email
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Требуется авторизация и подтверждённый email",
      });
    }

    // 1. Rate-limiting (3 запроса в час)
    const rateLimitKey = `rate_limit:resend:${ctx.user.id}`;
    const currentCount = await redis.incr(rateLimitKey);

    if (currentCount > 3) {
      const ttl = await redis.ttl(rateLimitKey);
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Слишком много запросов. Попробуйте через ${ttl} секунд.`,
      });
    }
    await redis.expire(rateLimitKey, 3600); // 1 час TTL

    // 2. Проверяем пользователя
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { id: true, emailVerified: true, isActive: true },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Пользователь с таким email не найден",
      });
    }

    if (user.emailVerified) {
      return { success: true, message: "Email уже подтверждён" };
    }

    if (!user.isActive) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Учётная запись деактивирована",
      });
    }

    // 3. Генерируем новый токен
    const newToken = randomUUID();
    const expiresAt = addHours(new Date(), 24);

    // 4. Обновляем запись в БД
    await ctx.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: newToken,
        verificationTokenExpires: expiresAt,
      },
    });

    // 5. Отправляем письмо
    try {
      await resend.emails.send({
        from: "no-reply@resend.dev",
        to: ctx.user.email,
        subject: "Подтвердите ваш email",
        html: `
            <p>Для подтверждения email перейдите по ссылке:</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${newToken}">
              Подтвердить Email
            </a>
            <p>Ссылка действительна 24 часа.</p>
          `,
      });

      return { success: true, message: "Письмо отправлено!" };
    } catch (error) {
      console.error("Ошибка отправки:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось отправить письмо",
      });
    }
  }),
});

import { publicProcedure, router } from "@/trpc/trpc";
import { TRPCError } from "@trpc/server";
import argon2 from "argon2";
import { loginSchema } from "@/shared/validations/auth";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { resend } from "@/lib/resend";
import { addHours } from "date-fns";
import { redis } from "@/lib/redis"; // Импортируем наш ioredis клиент

export const registerRouter = router({
  register: publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    if (!ctx.req) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Request object is missing",
      });
    }

    // Получаем IP для rate-limiting
    const identifier =
      ctx.req.headers.get("x-real-ip") || ctx.req.headers.get("x-forwarded-for") || "local";

    // Rate-limiting на чистом ioredis
    const rateLimitKey = `rate_limit:register:${identifier}`;
    const currentCount = await redis.incr(rateLimitKey);

    // Устанавливаем TTL только при первом запросе
    if (currentCount === 1) {
      await redis.expire(rateLimitKey, 10); // 10 секунд
    }

    // Проверяем лимит (5 запросов за 10 секунд)
    if (currentCount > 5) {
      const ttl = await redis.ttl(rateLimitKey);
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Слишком много запросов. Попробуйте через ${ttl} секунд.`,
      });
    }

    // Проверяем существующего пользователя
    const existingUser = await ctx.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Пользователь с таким email уже существует",
      });
    }

    try {
      // Хешируем пароль
      const hashedPassword = await argon2.hash(input.password);
      const tokenId = randomUUID();
      const verificationToken = randomUUID();
      const verificationTokenExpires = addHours(new Date(), 24);

      // Удаляем просроченные неподтвержденные пользователи
      await ctx.prisma.user.deleteMany({
        where: {
          email: input.email,
          verificationTokenExpires: { lt: new Date() },
        },
      });

      // Создаем пользователя в транзакции
      const newUser = await ctx.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: input.email,
            password: hashedPassword,
            activeRefreshTokens: [],
          },
          select: { id: true },
        });

        await tx.user.update({
          where: { id: user.id },
          data: {
            verificationToken,
            verificationTokenExpires,
            activeRefreshTokens: { push: tokenId },
          },
        });

        return user;
      });

      // Отправляем email для подтверждения
      try {
        await resend.emails.send({
          from: "no-reply@resend.dev",
          to: input.email,
          subject: "Подтверждение почты",
          html: `
            <p>Здравствуйте! Подтвердите свою почту, перейдя по ссылке:</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${verificationToken}">
              Подтвердить Email
            </a>`,
        });
      } catch (error) {
        console.error("Ошибка отправки email:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось отправить письмо для подтверждения почты",
          cause: error instanceof Error ? error.message : String(error),
        });
      }

      // Генерируем JWT токены
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Ошибка конфигурации сервера",
        });
      }

      const tokenPayload = {
        userId: newUser.id,
        jti: tokenId,
      };

      const [token, refreshToken] = await Promise.all([
        jwt.sign(tokenPayload, jwtSecret, { expiresIn: "15m" }),
        jwt.sign({ ...tokenPayload, isRefresh: true }, jwtSecret, { expiresIn: "7d" }),
      ]);

      // Устанавливаем cookies
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
      };

      const cookieStore = await cookies();
      cookieStore.set("token", token, {
        ...cookieOptions,
        maxAge: 15 * 60,
        sameSite: "strict",
      });

      cookieStore.set("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 7,
        path: "/api/auth/refresh",
      });

      return {
        success: true,
        message: "Регистрация прошла успешно",
      };
    } catch (error) {
      console.error("Registration error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Произошла ошибка при регистрации",
        cause: error,
      });
    }
  }),
});

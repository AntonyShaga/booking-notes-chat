import argon2 from "argon2";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { loginSchema } from "@/shared/validations/auth";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { redis } from "@/lib/redis";

export const authRouter = router({
  getCurrentUser: publicProcedure.query(({ ctx }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Пользователь не авторизован. Пожалуйста, войдите в систему.",
      });
    }
    return ctx.session.user;
  }),
  login: publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        password: true,
        isActive: true,
      },
    });
    // Получаем IP для rate-limiting
    const identifier =
      ctx.req.headers.get("x-real-ip") || ctx.req.headers.get("x-forwarded-for") || "local";

    // Rate-limiting на чистом ioredis
    const rateLimitKey = `rate_limit:login:${identifier}`;
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

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Пользователь с таким email не найден",
      });
    }

    if (!user.isActive) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Учетная запись неактивна. Подтвердите почту.",
      });
    }

    if (!user.password) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Аккаунт зарегистрирован через Google. Войдите через Google.",
      });
    }

    const isPasswordCorrect = await argon2.verify(user.password, input.password);
    if (!isPasswordCorrect) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Неверный пароль",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Ошибка конфигурации сервера",
      });
    }

    const tokenId = randomUUID();
    const tokenPayload = {
      userId: user.id,
      jti: tokenId,
    };

    const [token, refreshToken] = await Promise.all([
      jwt.sign(tokenPayload, jwtSecret, { expiresIn: "15m" }),
      jwt.sign({ ...tokenPayload, isRefresh: true }, jwtSecret, { expiresIn: "7d" }),
    ]);

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
      sameSite: "strict",
      path: "/",
    });

    try {
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
          updatedAt: new Date(),
          activeRefreshTokens: { push: tokenId },
        },
      });
    } catch (error) {
      console.error("Ошибка обновления lastLogin:", error);
    }
    return { message: "Вход выполнен успешно", userId: user.id };
  }),
});

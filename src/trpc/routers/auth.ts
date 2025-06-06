import argon2 from "argon2";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { loginSchema } from "@/shared/validations/auth";
import { redis } from "@/lib/redis";
import { generateTokens } from "@/lib/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";
import { authenticator } from "otplib";
import { redisKeys } from "@/lib/2fa/redis";
import { verifyEmail2FA } from "@/lib/2fa/email";

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
        twoFactorEnabled: true,
      },
    });

    const identifier =
      ctx.req.headers.get("x-real-ip") || ctx.req.headers.get("x-forwarded-for") || "local";

    const rateLimitKey = `rate_limit:login:${identifier}`;
    const currentCount = await redis.incr(rateLimitKey);
    if (currentCount === 1) {
      await redis.expire(rateLimitKey, 10); // 10 секунд
    }
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

    if (user.twoFactorEnabled) {
      //const key = `2fa:pending:${user.id}`;
      await ctx.redis.set(`2fa:status:${user.id}`, "waiting", "EX", 300); // 5 минут
      return { requires2FA: true, userId: user.id };
    }

    const { tokenId, refreshJwt, accessJwt } = await generateTokens(user.id);
    await setAuthCookies(accessJwt, refreshJwt);

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

  verify2FAAfterLogin: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        code: z.string().length(6),
        method: z.enum(["qr", "manual", "email"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { code, method, userId } = input;

      const redisKey = redisKeys.pending(userId);

      const pending = await ctx.redis.hgetall(redisKey);
      if (!pending) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Сессия подтверждения 2FA истекла или недействительна",
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          twoFactorSecret: true,
          isActive: true,
        },
      });

      if (!user || !user.twoFactorSecret) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "2FA не настроена или пользователь не найден",
        });
      }

      if (method === "email") {
        await verifyEmail2FA({
          redis: ctx.redis,
          userId: userId,
          code,
        });

        const { tokenId, refreshJwt, accessJwt } = await generateTokens(user.id);
        await setAuthCookies(accessJwt, refreshJwt);

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

        return {
          message: "2FA подтверждена. Вход выполнен.",
          userId: user.id,
        };
      }

      const isCodeValid = authenticator.check(input.code, user.twoFactorSecret);
      if (!isCodeValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Неверный код 2FA",
        });
      }

      await redis.del(redisKey);
    }),
});

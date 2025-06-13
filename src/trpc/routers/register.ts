import { publicProcedure, router } from "@/trpc/trpc";
import { TRPCError } from "@trpc/server";
import argon2 from "argon2";
import { loginSchema } from "@/shared/validations/auth";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { resend } from "@/lib/resend";
import { addHours } from "date-fns";
import { redis } from "@/lib/redis";
import { generateTokens } from "@/lib/jwt";

export const registerRouter = router({
  register: publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    if (!ctx.req) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Request object is missing",
      });
    }

    const identifier =
      ctx.req.headers.get("x-real-ip") || ctx.req.headers.get("x-forwarded-for") || "local";

    const rateLimitKey = `rate_limit:register:${identifier}`;
    const currentCount = await redis.incr(rateLimitKey);
    if (currentCount === 1) {
      await redis.expire(rateLimitKey, 10);
    }

    if (currentCount > 5) {
      const ttl = await redis.ttl(rateLimitKey);
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Слишком много запросов. Попробуйте через ${ttl} секунд.`,
      });
    }

    const existingUser = await ctx.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Пользователь с таким email уже существует",
      });
    }

    const hashedPassword = await argon2.hash(input.password);
    const verificationToken = randomUUID();
    const verificationTokenExpires = addHours(new Date(), 24);

    // Удаляем старых неподтвержденных юзеров
    await ctx.prisma.user.deleteMany({
      where: {
        email: input.email,
        verificationTokenExpires: { lt: new Date() },
      },
    });

    const { id: userId } = await ctx.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          activeRefreshTokens: [],
        },
        select: { id: true },
      });

      const { tokenId } = await generateTokens(user.id); // заранее получить ID

      await tx.user.update({
        where: { id: user.id },
        data: {
          verificationToken,
          verificationTokenExpires,
          activeRefreshTokens: { push: tokenId },
        },
      });

      return { id: user.id };
    });

    try {
      await resend.emails.send({
        from: "no-reply@resend.dev",
        to: input.email,
        subject: "Подтверждение почты",
        html: `
          <p>Здравствуйте! Подтвердите свою почту, перейдя по ссылке:</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}">
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

    // Генерация токенов (второй раз для доступа, но с тем же userId)
    const { accessJwt, refreshJwt } = await generateTokens(userId);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict" as const,
    };

    const cookieStore = await cookies();
    cookieStore.set("token", accessJwt, {
      ...cookieOptions,
      maxAge: 15 * 60,
    });
    cookieStore.set("refreshToken", refreshJwt, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7,
    });

    return {
      success: true,
      message: "Регистрация прошла успешно. Подтвердите почту.",
    };
  }),
});

import { publicProcedure, router } from "@/trpc/trpc";
import { TRPCError } from "@trpc/server";
import argon2 from "argon2";
import { loginSchema } from "@/shared/validations/auth";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { resend } from "@/lib/resend";
import { addHours } from "date-fns";

export const registerRouter = router({
  register: publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
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
      const hashedPassword = await argon2.hash(input.password);

      const newUser = await ctx.prisma.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
        },
        select: { id: true },
      });

      const verificationToken = randomUUID();
      const verificationTokenExpires = addHours(new Date(), 24);

      await ctx.prisma.user.update({
        where: { id: newUser.id },
        data: { verificationToken, verificationTokenExpires },
      });
      console.log(input.email);
      await resend.emails.send({
        from: "no-reply@resend.dev",
        to: input.email,
        subject: "Подтверждение почты",
        html: `
    <p>Здравствуйте! Подтвердите свою почту, перейдя по ссылке:</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${verificationToken}">
      Подтвердить Email
    </a>
  `,
      });

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Ошибка конфигурации сервера",
        });
      }

      const tokenId = randomUUID();
      const tokenPayload = {
        userId: newUser.id,
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

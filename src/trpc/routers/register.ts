import { publicProcedure, router } from "@/trpc/trpc";
import { TRPCError } from "@trpc/server";
import argon2 from "argon2";
import { loginSchema } from "@/shared/validations/auth";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

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

      await ctx.prisma.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
        },
      });

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "JWT_SECRET не задан в переменных окружения",
        });
      }

      const token = jwt.sign({ email: input.email }, jwtSecret, { expiresIn: "7d" });
      const cookieStore = await cookies();

      cookieStore.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
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

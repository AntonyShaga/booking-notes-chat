import argon2 from "argon2";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { loginSchema } from "@/shared/validations/auth";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

export const authRouter = router({
  getCurrentUser: publicProcedure.query(({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return ctx.user;
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

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Пользователь не найден",
      });
    }

    if (!user.isActive) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Учетная запись неактивна",
      });
    }

    if (!user.password) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
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
      path: "/api/auth/refresh",
    });

    try {
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Ошибка обновления lastLogin:", error);
    }
    return { message: "Вход выполнен успешно", userId: user.id };
  }),
});

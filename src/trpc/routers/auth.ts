import argon2 from "argon2";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { loginSchema } from "@/shared/validations/auth";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

export const authRouter = router({
  login: publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        password: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive || !(await argon2.verify(user.password, input.password))) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Неверные учетные данные или учетная запись неактивна",
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

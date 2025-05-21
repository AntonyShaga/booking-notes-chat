import { publicProcedure, router } from "@/trpc/trpc";
import { cookies } from "next/headers";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

export const refreshTokenRouter = router({
  refreshToken: publicProcedure.mutation(async ({ ctx }) => {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Refresh token is missing from cookies",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "JWT secret is not configured",
      });
    }

    try {
      // 1. Декодируем без проверки
      const decoded = jwt.decode(refreshToken) as {
        userId?: string;
        jti?: string;
        isRefresh?: boolean;
      } | null;

      // Валидация структуры токена
      if (!decoded?.userId || !decoded.jti || !decoded.isRefresh) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid refresh token structure",
        });
      }

      // 2. Проверяем пользователя и активные токены
      const user = await ctx.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, activeRefreshTokens: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Проверяем, не отозван ли токен
      if (!user.activeRefreshTokens.includes(decoded.jti)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Refresh token is revoked",
        });
      }

      // 3. Проверяем подпись (игнорируя срок действия)
      try {
        const verified = jwt.verify(refreshToken, jwtSecret, { ignoreExpiration: true }) as {
          userId: string;
          jti: string;
          isRefresh: boolean;
        };

        // Дополнительная проверка соответствия payload
        if (verified.userId !== decoded.userId || verified.jti !== decoded.jti) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Token payload mismatch",
          });
        }
      } catch (verifyError) {
        if (verifyError instanceof jwt.JsonWebTokenError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid token signature",
          });
        }
        throw verifyError;
      }

      // 4. Генерируем новые токены
      const newTokenId = randomUUID();
      const tokenPayload = {
        userId: user.id,
        jti: newTokenId,
      };

      const [newAccessToken, newRefreshToken] = await Promise.all([
        jwt.sign(tokenPayload, jwtSecret, { expiresIn: "15m" }),
        jwt.sign({ ...tokenPayload, isRefresh: true }, jwtSecret, { expiresIn: "7d" }),
      ]);

      // 5. Обновляем список активных токенов
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          activeRefreshTokens: {
            set: user.activeRefreshTokens
              .filter((token) => token !== decoded.jti)
              .concat(newTokenId),
          },
        },
      });

      // 6. Устанавливаем куки
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
      };

      cookieStore.set("token", newAccessToken, {
        ...cookieOptions,
        maxAge: 15 * 60,
        sameSite: "strict",
      });

      cookieStore.set("refreshToken", newRefreshToken, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 7,
      });

      return { success: true, userId: user.id };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to refresh token",
        cause: error,
      });
    }
  }),
});

import { publicProcedure, router } from "@/trpc/trpc";
import { cookies } from "next/headers";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { generateTokens } from "@/lib/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";

/**
 * A tRPC router that handles refreshing access and refresh tokens via a valid refresh token.
 *
 * @remarks
 * This endpoint:
 * - Extracts the refresh token from cookies
 * - Validates and verifies the token structure and signature
 * - Ensures the token is still active in the database
 * - Revokes the old token and issues a new access/refresh pair
 * - Updates the user's active tokens in the database
 * - Sets new cookies for authentication
 *
 * @throws TRPCError with appropriate messages for:
 * - Missing or malformed token
 * - Invalid or revoked token
 * - Missing environment variables
 * - User not found
 * - Token verification errors
 *
 * @example
 * const result = await trpc.refreshTokenRouter.refreshToken.mutate();
 * if (result.success) {
 *   console.log("Tokens refreshed for user:", result.userId);
 * }
 */
export const refreshTokenRouter = router({
  refreshToken: publicProcedure.mutation(async ({ ctx }) => {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Отсутствует refresh токен в куках",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Секрет JWT не сконфигурирован",
      });
    }

    try {
      const decoded = jwt.decode(refreshToken) as {
        userId?: string;
        jti?: string;
        isRefresh?: boolean;
      } | null;

      if (!decoded?.userId || !decoded.jti || !decoded.isRefresh) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Неверная структура refresh токена",
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, activeRefreshTokens: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Пользователь не найден",
        });
      }

      if (!user.activeRefreshTokens.includes(decoded.jti)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Refresh токен отозван",
        });
      }

      try {
        const verified = jwt.verify(refreshToken, jwtSecret, { ignoreExpiration: true }) as {
          userId: string;
          jti: string;
          isRefresh: boolean;
        };

        if (verified.userId !== decoded.userId || verified.jti !== decoded.jti) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Несовпадение данных токена",
          });
        }
      } catch (verifyError) {
        if (verifyError instanceof jwt.JsonWebTokenError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Неверная подпись токена",
          });
        }
        throw verifyError;
      }

      const {
        accessJwt: newAccessToken,
        refreshJwt: newRefreshToken,
        tokenId: newTokenId,
      } = await generateTokens(user.id);

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

      await setAuthCookies(newAccessToken, newRefreshToken);

      return { success: true, userId: user.id };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось обновить токены",
        cause: error,
      });
    }
  }),
});

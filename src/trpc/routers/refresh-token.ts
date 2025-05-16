import { publicProcedure, router } from "@/trpc/trpc";
import { cookies } from "next/headers";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

export const refreshTokenRouter = router({
  refreshToken: publicProcedure.mutation(async ({ ctx }) => {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;
    console.log("refreshToken", cookieStore);
    console.log("refreshToken", refreshToken);
    if (!refreshToken) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
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
      const decoded = jwt.verify(refreshToken, jwtSecret) as {
        userId: string;
        jti: string;
        isRefresh: boolean;
      };

      if (!decoded.isRefresh) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Provided token is not a refresh token",
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, activeRefreshTokens: true },
      });

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      if (!user.activeRefreshTokens.includes(decoded.jti)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Refresh token is invalid or expired",
        });
      }

      const newTokenId = randomUUID();
      const tokenPayload = {
        userId: user.id,
        jti: newTokenId,
      };

      const [newAccessToken, newRefreshToken] = await Promise.all([
        jwt.sign(tokenPayload, jwtSecret, { expiresIn: "15m" }),
        jwt.sign({ ...tokenPayload, isRefresh: true }, jwtSecret, { expiresIn: "7d" }),
      ]);

      // Update active refresh tokens
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

      // Set new cookies
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
        path: "/",
      });

      return { success: true };
    } catch (error) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Failed to refresh token",
      });
    }
  }),
});

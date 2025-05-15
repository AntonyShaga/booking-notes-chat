import { publicProcedure, router } from "@/trpc/trpc";
import { cookies } from "next/headers";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

export const refreshTokenRouter = router({
  refreshToken: publicProcedure.mutation(async ({ ctx }) => {
    const cookieStore = await cookies();
    console.log("refreshToken", cookieStore);
    const refreshToken = cookieStore.get("refreshToken")?.value;
    console.log("refreshToken", refreshToken);
    if (!refreshToken) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Request object is missing" });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }

    try {
      const decoded = jwt.verify(refreshToken, jwtSecret) as {
        userId: string;
        jti: string;
        isRefresh: boolean;
      };

      if (!decoded.isRefresh) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, activeRefreshTokens: true },
      });

      if (!user || !user.activeRefreshTokens.includes(decoded.jti)) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const newTokenId = randomUUID();
      const tokenPayload = {
        userId: user.id,
        jti: newTokenId,
      };

      const [newToken, newRefreshToken] = await Promise.all([
        jwt.sign(tokenPayload, jwtSecret, { expiresIn: "15m" }),
        jwt.sign({ ...tokenPayload, isRefresh: true }, jwtSecret, { expiresIn: "7d" }),
      ]);

      // Обновляем список активных refresh токенов
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

      // Устанавливаем новые cookies
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
      };

      cookieStore.set("token", newToken, {
        ...cookieOptions,
        maxAge: 15 * 60,
        sameSite: "strict",
      });

      cookieStore.set("refreshToken", newRefreshToken, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 7,
        path: "/api/auth/refresh",
      });

      return { success: true };
    } catch (error) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
  }),
});

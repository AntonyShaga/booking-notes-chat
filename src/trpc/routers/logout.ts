import { protectedProcedure, router } from "@/trpc/trpc";
import { cookies } from "next/headers";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import { getTranslation } from "@/lib/errors/messages";

export const logout = router({
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      return { success: true, message: "Выход выполнен" };
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: getTranslation(ctx.lang, "errors.logout.jwtSecretMissing"),
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, jwtSecret) as {
        sub: string;
        jti: string;
        isRefresh?: boolean;
      };

      if (!decoded.isRefresh) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: getTranslation(ctx.lang, "errors.logout.invalidRefreshToken"),
        });
      }
      console.log(decoded);
      await ctx.prisma.user.update({
        where: { id: decoded.sub },
        data: {
          activeRefreshTokens: {
            set: ctx.session.user.activeRefreshTokens?.filter((id) => id !== decoded.jti) ?? [],
          },
        },
      });
    } catch (err) {
      console.error("Ошибка при logout:", err);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: getTranslation(ctx.lang, "errors.logout.errorLoggingOut"),
      });
    }

    cookieStore.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    cookieStore.set("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return { success: true, message: "Вы успешно вышли из аккаунта" };
  }),
});

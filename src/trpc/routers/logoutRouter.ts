import { publicProcedure, router } from "@/trpc/trpc";
import { cookies } from "next/headers";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";

export const logoutRouter = router({
  logout: publicProcedure.mutation(async ({ ctx }) => {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      return { success: true, message: "Выход выполнен" };
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "JWT_SECRET не установлен в переменных окружения",
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, jwtSecret) as {
        userId: string;
        jti: string;
        isRefresh?: boolean;
      };

      if (!decoded.isRefresh) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Неверный refresh токен",
        });
      }

      await ctx.prisma.user.update({
        where: { id: decoded.userId },
        data: {
          activeRefreshTokens: {
            set: ctx.session?.user?.activeRefreshTokens?.filter((id) => id !== decoded.jti) ?? [],
          },
        },
      });
    } catch (err) {
      console.error("Ошибка при logout:", err);
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

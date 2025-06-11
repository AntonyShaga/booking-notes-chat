import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { inferAsyncReturnType } from "@trpc/server";
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import { tryRefreshToken } from "@/lib/auth/refreshToken";
import prisma from "@/lib/db";
import { sendEmail } from "@/lib/sendEmail";
import { redis } from "@/lib/redis";

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const { req, resHeaders } = opts;
  const cookieHeader = req.headers.get("cookie");
  const cookies = cookieHeader ? parse(cookieHeader) : {};

  const accessToken = cookies.token;
  const refreshToken = cookies.refreshToken;
  const jwtSecret = process.env.JWT_SECRET;

  let user = null;

  if (accessToken && jwtSecret) {
    try {
      const payload = jwt.verify(accessToken, jwtSecret) as { userId: string };
      user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, activeRefreshTokens: true, name: true, picture: true },
      });
    } catch (err: unknown) {
      console.warn("❗ Access токен невалиден:", err instanceof Error ? err.message : String(err));
      if (refreshToken) {
        try {
          const result = await tryRefreshToken({ refreshToken, jwtSecret });
          console.log("🔁 Успешное обновление токенов:", result);
          user = result.user;

          resHeaders.append(
            "Set-Cookie",
            `token=${result.accessToken}; path=/; HttpOnly; SameSite=Lax; Max-Age=900`
          );
          resHeaders.append(
            "Set-Cookie",
            `refreshToken=${result.refreshToken}; path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
          );
        } catch (e) {
          console.error("❌ Ошибка автообновления токена:", e);
        }
      }
    }
  }

  // 👇 Обработка случая: access токена нет, но есть refresh токен
  if (!accessToken && refreshToken && jwtSecret && !user) {
    try {
      const result = await tryRefreshToken({ refreshToken, jwtSecret });
      console.log("🔁 Успешное обновление токенов (без access):", result);
      user = result.user;

      resHeaders.append(
        "Set-Cookie",
        `token=${result.accessToken}; path=/; HttpOnly; SameSite=Lax; Max-Age=900`
      );
      resHeaders.append(
        "Set-Cookie",
        `refreshToken=${result.refreshToken}; path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
      );
    } catch (e) {
      console.error("❌ Ошибка автообновления по refresh токену:", e);
    }
  }

  return {
    prisma,
    req,
    resHeaders,
    session: user ? { user } : null,
    sendEmail,
    redis,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;

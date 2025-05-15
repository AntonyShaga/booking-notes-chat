import { PrismaClient } from "@prisma/client";
import { inferAsyncReturnType } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import jwt from "jsonwebtoken";
import { parse } from "cookie";
// Инициализация Prisma
export const prisma = new PrismaClient();

// Функция для создания контекста
export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const { req } = opts;

  const cookieHeader = req.headers.get("cookie");
  const cookies = cookieHeader ? parse(cookieHeader) : {};
  const token = cookies.token;

  let user = null;

  if (token && process.env.JWT_SECRET) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
      user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true },
      });
    } catch (err) {
      console.error("Ошибка верификации токена:", err);
    }
  }

  return {
    prisma,
    user, // добавили user в контекст!
    req,
  };
};

// Типизация контекста для использования в роутерах
export type Context = inferAsyncReturnType<typeof createContext>;

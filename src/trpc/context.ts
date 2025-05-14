import { PrismaClient } from "@prisma/client";
import { inferAsyncReturnType } from "@trpc/server";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

// Инициализация Prisma
export const prisma = new PrismaClient();

// Функция для создания контекста
export const createContext = (opts: FetchCreateContextFnOptions) => ({
  prisma, // Добавляем Prisma в контекст
  req: {
    ...opts.req,
    headers: opts.req.headers,
  },
});

// Типизация контекста для использования в роутерах
export type Context = inferAsyncReturnType<typeof createContext>;

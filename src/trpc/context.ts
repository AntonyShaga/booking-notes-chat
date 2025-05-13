import { PrismaClient } from "@prisma/client";
import { inferAsyncReturnType } from "@trpc/server";
import { CreateNextContextOptions } from "@trpc/server/adapters/next";

// Инициализация Prisma
export const prisma = new PrismaClient();

// Функция для создания контекста
export const createContext = ({ req, res }: CreateNextContextOptions) => ({
  req,
  res,
  prisma, // Добавляем Prisma в контекст
});

// Типизация контекста для использования в роутерах
export type Context = inferAsyncReturnType<typeof createContext>;

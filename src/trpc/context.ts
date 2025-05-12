// trpc/context.ts

import { PrismaClient } from "@prisma/client";
import { inferAsyncReturnType } from "@trpc/server";

// Инициализация Prisma
export const prisma = new PrismaClient();

// Функция для создания контекста
export const createContext = ({}) => ({
  prisma, // Добавляем Prisma в контекст
});

// Типизация контекста для использования в роутерах
export type Context = inferAsyncReturnType<typeof createContext>;

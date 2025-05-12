// trpc/trpc.ts

import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { Context } from "./context";
import { TRPCError } from "@trpc/server";

const t = initTRPC.context<Context>().create({
  transformer: superjson,

  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        code: error.code, // сохраняем код ошибки в `data`
        message: error.message,
      },
    };
  },
});

// Добавляем обработчик ошибок через middleware
const errorLoggingMiddleware = t.middleware(async ({ next, path, type }) => {
  try {
    return await next();
  } catch (error) {
    console.error(`❌ tRPC error on "${path}" [${type}]:`, error);

    // Мониторинг Prisma-ошибок
    if (
      error instanceof TRPCError &&
      error.code === "INTERNAL_SERVER_ERROR" &&
      error.cause instanceof Error &&
      error.cause.message.includes("PrismaClient")
    ) {
      console.error("🛑 PrismaClient internal error — возможно, база упала.");
    }

    throw error; // Пробрасываем ошибку дальше
  }
});

export const router = t.router;
export const publicProcedure = t.procedure.use(errorLoggingMiddleware); // Применяем middleware ко всем процедурам

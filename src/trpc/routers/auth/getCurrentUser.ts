import { publicProcedure } from "@/trpc/trpc";
import { TRPCError } from "@trpc/server";

export const getCurrentUser = publicProcedure.query(({ ctx }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Пользователь не авторизован. Пожалуйста, войдите в систему.",
    });
  }
  return ctx.session.user;
});

export const getCurrentUserRouter = { getCurrentUser };

import { publicProcedure } from "@/trpc/trpc";
import { TRPCError } from "@trpc/server";
import { getTranslation } from "@/lib/errors/messages";

export const getCurrentUser = publicProcedure.query(({ ctx }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: getTranslation(ctx.lang, "errors.auth.unauthorized"),
    });
  }
  return ctx.session.user;
});

export const getCurrentUserRouter = { getCurrentUser };

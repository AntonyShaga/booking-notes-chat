import { TRPCError } from "@trpc/server";
import { middleware } from "@/trpc/trpc";
import { Role } from "@prisma/client";

export const hasRole = (roles: Role[]) =>
  middleware(({ ctx, next }) => {
    const userRole = ctx.session?.user.role;

    if (!userRole || !roles.includes(userRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для доступа",
      });
    }

    return next({ ctx });
  });

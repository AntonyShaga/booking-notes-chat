import { protectedProcedure } from "@/trpc/trpc";

export const get2FAStatus = protectedProcedure.query(async ({ ctx }) => {
  const user = await ctx.prisma.user.findUnique({
    where: { id: ctx.session.user.id },
    select: { twoFactorEnabled: true },
  });

  return { isEnabled: user?.twoFactorEnabled ?? false };
});

export const statusRouter = {
  get2FAStatus,
};

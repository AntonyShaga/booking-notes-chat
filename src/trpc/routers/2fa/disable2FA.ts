import { protectedProcedure } from "@/trpc/trpc";

export const disable2FA = protectedProcedure.mutation(async ({ ctx }) => {
  await ctx.prisma.user.update({
    where: { id: ctx.session.user.id },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
  });

  return { success: true };
});

export const disable2FARouter = {
  disable2FA,
};

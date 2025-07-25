import { protectedProcedure, router } from "@/trpc/trpc";
export const getEmailStatusRout = router({
  getEmailStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { emailVerified: true },
    });

    return { verified: !!user?.emailVerified };
  }),
});

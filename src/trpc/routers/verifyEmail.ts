import { publicProcedure, router } from "@/trpc/trpc";
import z from "zod";
import { TRPCError } from "@trpc/server";
export const verifyEmailRouter = router({
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findFirst({
        where: { verificationToken: input.token },
      });
      if (!user) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Недействительный токен" });
      }

      if (!user.isActive) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Учётная запись деактивирована",
        });
      }

      if (user.verificationTokenExpires && new Date() > user.verificationTokenExpires) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Срок действия токена истёк. Запросите новый.",
        });
      }

      if (user.emailVerified) {
        return { message: "Email уже подтверждён." };
      }

      await ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpires: null,
        },
      });

      return { message: "Email успешно подтверждён" }; // 6
    }),
});

import argon2 from "argon2";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Context } from "../context";
import { loginSchema } from "@/shared/validations/auth";

export const authRouter = router({
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }: { input: z.infer<typeof loginSchema>; ctx: Context }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user || !(await argon2.verify(user.password, input.password))) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Неверный email или пароль",
        });
      }

      const isPasswordValid = await argon2.verify(user.password, input.password);
      if (!isPasswordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid password",
        });
      }

      return { message: "Login successful", userId: user.id };
    }),
});

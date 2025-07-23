import { publicProcedure, router } from "@/trpc/trpc";
import { TRPCError } from "@trpc/server";
import argon2 from "argon2";
import { loginSchema } from "@/shared/validations/auth";
import { randomUUID } from "node:crypto";
import { addHours } from "date-fns";
import { generateTokens } from "@/lib/jwt";
import { redisKeys } from "@/lib/2fa/redis";
import { checkRateLimit } from "@/lib/2fa/helpers";
import { setAuthCookies } from "@/lib/auth/cookies";
import { getTranslation } from "@/lib/errors/messages";

export const registerRouter = router({
  register: publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    const identifier =
      ctx.req.headers.get("x-real-ip") || ctx.req.headers.get("x-forwarded-for") || "local";

    const rateLimitKey = redisKeys.registerRateLimit(identifier);
    await checkRateLimit(ctx.redis, rateLimitKey, 5, 10);

    const existingUser = await ctx.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new TRPCError({
        code: "CONFLICT",
        message: getTranslation(ctx.lang, "register.emailConflict"),
      });
    }

    const hashedPassword = await argon2.hash(input.password);
    const verificationToken = randomUUID();
    const verificationTokenExpires = addHours(new Date(), 24);

    await ctx.prisma.user.deleteMany({
      where: {
        email: input.email,
        verificationTokenExpires: { lt: new Date() },
      },
    });

    const { id: userId } = await ctx.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          activeRefreshTokens: [],
        },
        select: { id: true },
      });

      const { tokenId } = await generateTokens(user.id, tx);

      await tx.user.update({
        where: { id: user.id },
        data: {
          verificationToken,
          verificationTokenExpires,
          activeRefreshTokens: { push: tokenId },
        },
      });

      return { id: user.id };
    });

    try {
      ctx.sendEmail({
        to: input.email,
        subject: "Подтверждение почты",
        token: verificationToken,
      });
    } catch (error) {
      console.error(getTranslation(ctx.lang, "email.sendErrorLog"), error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: getTranslation(ctx.lang, "email.sendError"),
        cause: error instanceof Error ? error.message : String(error),
      });
    }

    const { accessJwt, refreshJwt } = await generateTokens(userId, ctx.prisma);
    await setAuthCookies(accessJwt, refreshJwt);

    return {
      success: true,
      message: getTranslation(ctx.lang, "register.success"),
    };
  }),
});

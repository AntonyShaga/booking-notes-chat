import { TRPCError } from "@trpc/server";
import { PrismaClient } from "@prisma/client";

import { setAuthCookies } from "@/lib/auth/cookies";
import { getTranslation } from "@/lib/errors/messages";

interface UpdateUserLoginParams {
  userId: string;
  tokenId: string;
  accessJwt: string;
  refreshJwt: string;
  prisma: PrismaClient;
  lang: "en" | "ru";
}

export async function updateUserLoginAndSetCookies({
  userId,
  tokenId,
  accessJwt,
  refreshJwt,
  prisma,
  lang,
}: UpdateUserLoginParams) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          lastLogin: new Date(),
          updatedAt: new Date(),
          activeRefreshTokens: { push: tokenId },
        },
      });
    });
    await setAuthCookies(accessJwt, refreshJwt);
  } catch (error) {
    console.error(getTranslation(lang, "common.lastLoginUpdateError"), error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: getTranslation(lang, "common.serverConfigError"),
    });
  }
}

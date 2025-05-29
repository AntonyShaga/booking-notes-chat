import { prisma } from "@/lib/prisma";

export async function updateActiveRefreshTokens(
  userId: string,
  currentTokens: string[] = [],
  newTokenId: string
) {
  const tokens = [...(currentTokens || []).slice(-4), newTokenId]; // максимум 5 токенов
  await prisma.user.update({
    where: { id: userId },
    data: {
      activeRefreshTokens: {
        set: tokens,
      },
    },
  });
}

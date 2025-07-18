import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { Prisma, PrismaClient } from "@prisma/client";

/**
 * Генерирует уникальный идентификатор токена (JTI)
 */
export function generateTokenId(): string {
  return randomUUID();
}

/**
 * Асинхронно генерирует пару JWT токенов: access и refresh, включая роль пользователя в payload.
 *
 * @param userId - Идентификатор пользователя (используется в `sub`)
 * @param prismaClient - Экземпляр PrismaClient (внедряется извне для тестируемости)
 * @returns Объект с accessJwt, refreshJwt и JTI токена
 *
 * @throws Ошибка, если переменная окружения `JWT_SECRET` не задана или пользователь не найден
 */
export async function generateTokens(
  userId: string,
  prismaClient: PrismaClient | Prisma.TransactionClient
): Promise<{
  accessJwt: string;
  refreshJwt: string;
  tokenId: string;
}> {
  const JWT_SECRET = process.env.JWT_SECRET!;
  if (!JWT_SECRET) throw new Error("❌ JWT_SECRET is not defined");

  const user = await prismaClient.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  console.log(user);
  if (!user?.role) {
    throw new Error("❌ Пользователь не найден или у него нет роли");
  }

  const tokenId = generateTokenId();

  const [accessJwt, refreshJwt] = await Promise.all([
    jwt.sign({ sub: userId, jti: tokenId, role: user.role }, JWT_SECRET, {
      expiresIn: "15m",
      algorithm: "HS256",
    }),
    jwt.sign({ sub: userId, jti: tokenId, isRefresh: true, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
      algorithm: "HS256",
    }),
  ]);

  return { accessJwt, refreshJwt, tokenId };
}

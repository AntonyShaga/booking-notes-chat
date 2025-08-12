import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { Prisma, PrismaClient } from "@prisma/client";

/**
 * Generates a unique token identifier (JTI).
 */
export function generateTokenId(): string {
  return randomUUID();
}

/**
 * Asynchronously generates a pair of JWT tokens: access and refresh, including the user's role in the payload.
 *
 * @param userId - The user's ID (used in `sub`).
 * @param prismaClient - An instance of PrismaClient (injected for testability).
 * @returns An object with accessJwt, refreshJwt, and the token's JTI.
 *
 * @throws An error if the `JWT_SECRET` environment variable is not set or if the user is not found.
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
  if (!JWT_SECRET) {
    throw new Error("❌ JWT_SECRET is not defined");
  }

  const user = await prismaClient.user.findUnique({
    where: { id: userId },
    select: { role: true, twoFactorEnabled: true },
  });
  console.log(user);
  if (!user?.role) {
    throw new Error("❌ User not found or has no role");
  }

  const tokenId = generateTokenId();

  const [accessJwt, refreshJwt] = await Promise.all([
    jwt.sign(
      { sub: userId, jti: tokenId, role: user.role, twoFactorEnabled: user.twoFactorEnabled },
      JWT_SECRET,
      {
        expiresIn: "15m",
        algorithm: "HS256",
      }
    ),
    jwt.sign(
      {
        sub: userId,
        jti: tokenId,
        isRefresh: true,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      JWT_SECRET,
      {
        expiresIn: "7d",
        algorithm: "HS256",
      }
    ),
  ]);

  return { accessJwt, refreshJwt, tokenId };
}

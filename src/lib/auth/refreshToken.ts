// lib/auth/refreshToken.ts

import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

export async function tryRefreshToken({
  refreshToken,
  jwtSecret,
}: {
  refreshToken: string;
  jwtSecret: string;
}) {
  const decoded = jwt.decode(refreshToken) as {
    userId?: string;
    jti?: string;
    isRefresh?: boolean;
  } | null;

  if (!decoded?.userId || !decoded.jti || !decoded.isRefresh) {
    throw new Error("Invalid refresh token structure");
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, activeRefreshTokens: true },
  });

  if (!user || !user.activeRefreshTokens.includes(decoded.jti)) {
    throw new Error("Refresh token is revoked or user not found");
  }

  const verified = jwt.verify(refreshToken, jwtSecret, {
    ignoreExpiration: true,
  }) as {
    userId: string;
    jti: string;
    isRefresh: boolean;
  };

  if (verified.userId !== decoded.userId || verified.jti !== decoded.jti || !verified.isRefresh) {
    throw new Error("Payload mismatch");
  }

  const newJti = randomUUID();
  const accessToken = jwt.sign({ userId: user.id, jti: newJti }, jwtSecret, { expiresIn: "15m" });

  const newRefreshToken = jwt.sign({ userId: user.id, jti: newJti, isRefresh: true }, jwtSecret, {
    expiresIn: "7d",
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      activeRefreshTokens: {
        set: user.activeRefreshTokens.filter((token) => token !== decoded.jti).concat(newJti),
      },
    },
  });

  return {
    user,
    accessToken,
    refreshToken: newRefreshToken,
  };
}

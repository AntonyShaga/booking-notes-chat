import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

export function generateTokenId() {
  return randomUUID();
}

export async function generateTokens(userId: string) {
  const JWT_SECRET = process.env.JWT_SECRET!;
  if (!JWT_SECRET) throw new Error("❌ JWT_SECRET is not defined");

  const tokenId = generateTokenId();

  const [accessJwt, refreshJwt] = await Promise.all([
    jwt.sign({ sub: userId, jti: tokenId }, JWT_SECRET, {
      expiresIn: "15m",
      algorithm: "HS256",
    }),
    jwt.sign({ sub: userId, jti: tokenId, isRefresh: true }, JWT_SECRET, {
      expiresIn: "7d",
      algorithm: "HS256",
    }),
  ]);

  return { accessJwt, refreshJwt, tokenId };
}

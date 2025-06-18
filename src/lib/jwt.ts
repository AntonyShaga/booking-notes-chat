import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

/**
 * Generates a unique token identifier (JTI) using UUID v4.
 *
 * @returns {string} A unique token ID.
 */
export function generateTokenId(): string {
  return randomUUID();
}

/**
 * Asynchronously generates a pair of JWT tokens: access and refresh.
 *
 * @param {string} userId - The user's unique identifier (used as the `sub` claim).
 * @returns {Promise<{
 *   accessJwt: string,
 *   refreshJwt: string,
 *   tokenId: string
 * }>} An object containing the access token, refresh token, and token ID (JTI).
 *
 * @throws {Error} If the JWT_SECRET environment variable is not defined.
 *
 * @example
 * const tokens = await generateTokens("user_123");
 * console.log(tokens.accessJwt); // JWT access token
 * console.log(tokens.refreshJwt); // JWT refresh token
 * console.log(tokens.tokenId);   // Unique token ID (JTI)
 */
export async function generateTokens(userId: string): Promise<{
  accessJwt: string;
  refreshJwt: string;
  tokenId: string;
}> {
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

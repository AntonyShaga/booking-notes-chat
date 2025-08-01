import { generateTokens } from "@/lib/jwt";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
describe("generateTokens", () => {
  const OLD_ENV = process.env;

  beforeAll(() => {
    process.env = { ...OLD_ENV, JWT_SECRET: "test_secret" };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  interface DecodedToken {
    userId: string;
    jti: string;
    exp?: number;
    isRefresh?: boolean;
  }

  it("должен вернуть access и refresh токены с одинаковым jti", async () => {
    const userId = "user_123";
    const { accessJwt, refreshJwt, tokenId } = await generateTokens(userId, prisma);

    const decodedAccess = jwt.verify(accessJwt, process.env.JWT_SECRET!) as DecodedToken;
    const decodedRefresh = jwt.verify(refreshJwt, process.env.JWT_SECRET!) as DecodedToken;

    expect(decodedAccess.userId).toBe(userId);
    expect(decodedAccess.jti).toBe(tokenId);
    expect(decodedAccess.exp).toBeDefined();

    expect(decodedRefresh.userId).toBe(userId);
    expect(decodedRefresh.jti).toBe(tokenId);
    expect(decodedRefresh.isRefresh).toBe(true);
  });
});

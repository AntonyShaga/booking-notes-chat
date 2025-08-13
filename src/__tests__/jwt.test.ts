import { generateTokens } from "@/lib/jwt";
import jwt from "jsonwebtoken";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: "user_123",
        role: "ADMIN",
        twoFactorEnabled: false,
      }),
    },
  },
}));

describe("generateTokens", () => {
  const OLD_ENV = process.env;

  beforeAll(() => {
    process.env = { ...OLD_ENV, JWT_SECRET: "test_secret" };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  interface DecodedToken {
    sub: string;
    jti: string;
    exp?: number;
    isRefresh?: boolean;
  }

  it("should return access and refresh tokens with the same jti", async () => {
    const { prisma } = await import("@/lib/prisma");

    const userId = "user_123";
    const { accessJwt, refreshJwt, tokenId } = await generateTokens(userId, prisma);

    const decodedAccess = jwt.verify(accessJwt, process.env.JWT_SECRET!) as DecodedToken;
    const decodedRefresh = jwt.verify(refreshJwt, process.env.JWT_SECRET!) as DecodedToken;

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: userId },
      select: { role: true, twoFactorEnabled: true },
    });

    expect(decodedAccess.sub).toBe(userId);
    expect(decodedAccess.jti).toBe(tokenId);
    expect(decodedAccess.exp).toBeDefined();

    expect(decodedRefresh.sub).toBe(userId);
    expect(decodedRefresh.jti).toBe(tokenId);
    expect(decodedRefresh.isRefresh).toBe(true);
  });
});

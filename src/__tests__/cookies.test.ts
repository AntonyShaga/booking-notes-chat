import { cookies as mockCookies } from "next/headers";
import { setAuthCookies } from "@/lib/auth/cookies";

// Mocking the 'next/headers' module
jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

describe("setAuthCookies", () => {
  const mockSet = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (mockCookies as jest.Mock).mockReturnValue({
      set: mockSet,
    });
  });

  it("sets access and refresh tokens", async () => {
    const access = "access_token";
    const refresh = "refresh_token";

    await setAuthCookies(access, refresh);

    expect(mockSet).toHaveBeenCalledTimes(2);
    expect(mockSet).toHaveBeenCalledWith(
      "token",
      access,
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        path: "/",
        sameSite: "lax",
        maxAge: 15 * 60,
      })
    );
    expect(mockSet).toHaveBeenCalledWith(
      "refreshToken",
      refresh,
      expect.objectContaining({
        maxAge: 60 * 60 * 24 * 7,
      })
    );
  });
});

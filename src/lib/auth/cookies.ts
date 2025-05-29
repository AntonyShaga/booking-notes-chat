import { cookies } from "next/headers";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  sameSite: "lax" as const,
};

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();

  cookieStore.set("token", accessToken, { ...cookieOptions, maxAge: 15 * 60 }); // 15 мин
  cookieStore.set("refreshToken", refreshToken, { ...cookieOptions, maxAge: 60 * 60 * 24 * 7 }); // 7 дней
}

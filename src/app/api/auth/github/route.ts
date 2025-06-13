import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";

export async function GET() {
  const state = randomBytes(16).toString("hex");
  const codeVerifier = randomBytes(32).toString("hex");

  // Правильное создание codeChallenge
  const codeChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`,
    scope: "read:user user:email",
    state,
    code_challenge: codeChallenge, // Добавляем code_challenge
    code_challenge_method: "S256", // Указываем метод хеширования
  });

  const response = NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );

  // Сохраняем state и codeVerifier в куки
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 минут
  });

  response.cookies.set("oauth_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 минут
  });

  return response;
}

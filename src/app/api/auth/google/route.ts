import { NextResponse } from "next/server";

import { randomBytes, createHash } from "crypto";

export async function GET() {
  // Генеруємо code_verifier (випадковий рядок 32-96 байт)
  const codeVerifier = randomBytes(32).toString("base64url");

  // Обчислюємо code_challenge (SHA-256 від verifier)
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");

  const state = randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state,
    code_challenge: codeChallenge, // Додаємо PKCE
    code_challenge_method: "S256", // Метод хешування (SHA-256)
  });

  // Зберігаємо state та code_verifier в cookies
  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );

  response.cookies.set("oauth_state", state, { httpOnly: true, secure: true });
  response.cookies.set("code_verifier", codeVerifier, { httpOnly: true, secure: true });

  return response;
}

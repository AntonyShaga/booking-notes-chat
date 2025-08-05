import { NextResponse } from "next/server";

import { randomBytes, createHash } from "crypto";

export async function GET() {
  const codeVerifier = randomBytes(32).toString("base64url");

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
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );

  response.cookies.set("oauth_state", state, { httpOnly: true, secure: true });
  response.cookies.set("code_verifier", codeVerifier, { httpOnly: true, secure: true });

  return response;
}

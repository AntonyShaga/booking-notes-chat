import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { TRPCError } from "@trpc/server";
import { setAuthCookies } from "@/lib/auth/cookies";
import { generateTokens } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    const identifier =
      req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for") || "local";

    const rateLimitKey = `rate_limit:google_callback:${identifier}`;
    const currentCount = await redis.incr(rateLimitKey);

    if (currentCount === 1) {
      await redis.expire(rateLimitKey, 10);
    }

    if (currentCount > 5) {
      const ttl = await redis.ttl(rateLimitKey);
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Слишком много запросов. Попробуйте через ${ttl} секунд.`,
      });
    }

    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");

    const cookieState = req.cookies.get("oauth_state")?.value;
    const codeVerifier = req.cookies.get("code_verifier")?.value;

    if (!code) {
      return NextResponse.json({ error: "Authorization code is required" }, { status: 400 });
    }

    if (!state || !cookieState || state !== cookieState) {
      return NextResponse.json({ error: "Invalid state parameter" }, { status: 400 });
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
        code_verifier: codeVerifier!,
      }),
    });

    if (!tokenRes.ok) {
      const errorData = await tokenRes.json();
      console.error("Google token exchange error:", errorData);
      throw new Error("Failed to exchange code for tokens");
    }

    const tokens = await tokenRes.json();
    const idToken = tokens.id_token;

    if (!idToken) {
      return NextResponse.json({ error: "No ID token received from Google" }, { status: 400 });
    }

    // ✅ Подтверждение подписи и извлечение данных
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return NextResponse.json({ error: "Failed to verify ID token" }, { status: 400 });
    }

    const { email, name, picture, sub: googleId, aud, iss } = payload;

    if (!email || !name || !googleId) {
      return NextResponse.json({ error: "Incomplete user data from Google" }, { status: 400 });
    }

    if (aud !== process.env.GOOGLE_CLIENT_ID) {
      return NextResponse.json({ error: "Invalid token audience" }, { status: 400 });
    }

    if (iss !== "https://accounts.google.com" && iss !== "accounts.google.com") {
      return NextResponse.json({ error: "Invalid token issuer" }, { status: 400 });
    }

    // 🧑‍💻 Создаём/обновляем пользователя
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        googleId,
        emailVerified: true,
        picture: picture || undefined,
      },
      create: {
        email,
        name,
        picture,
        googleId,
        emailVerified: true,
        activeRefreshTokens: [],
      },
    });

    const { tokenId, refreshJwt, accessJwt } = await generateTokens(user.id, prisma);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        activeRefreshTokens: {
          set: [...(user.activeRefreshTokens || []).slice(-4), tokenId],
        },
      },
    });

    // 🍪 Установка куки
    await setAuthCookies(accessJwt, refreshJwt);

    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}`);

    // 🧹 Очистка временных cookies
    response.cookies.delete("oauth_state");
    response.cookies.delete("code_verifier");

    // 🔐 Security headers
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    return response;
  } catch (error) {
    console.error("Google authentication error:", error);

    const redirectUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/login`);
    redirectUrl.searchParams.set("error", "google_auth_failed");

    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete("oauth_state");
    response.cookies.delete("code_verifier");

    return response;
  }
}

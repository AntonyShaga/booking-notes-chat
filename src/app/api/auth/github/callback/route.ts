// /api/auth/github/callback.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

interface GitHubUser {
  id: number;
  login: string;
  name?: string;
  avatar_url?: string;
}
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    // Проверка state и codeVerifier
    const cookieState = req.cookies.get("oauth_state")?.value;
    const codeVerifier = req.cookies.get("oauth_code_verifier")?.value;

    if (!code || !state || state !== cookieState || !codeVerifier) {
      return NextResponse.json({ error: "Invalid authentication request" }, { status: 400 });
    }

    // Обмен кода на токен
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/github/callback`,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenRes.ok) throw new Error("Token exchange failed");

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) throw new Error("No access token received");

    // Получение данных пользователя
    const [userRes, emailRes] = await Promise.all([
      fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    ]);

    if (!userRes.ok || !emailRes.ok) throw new Error("Failed to fetch user data");

    const userData: GitHubUser = await userRes.json();
    const emails: GitHubEmail[] = await emailRes.json();
    const primaryEmail = emails.find((e) => e.primary && e.verified)?.email;
    if (!primaryEmail || !userData.login) {
      return NextResponse.json({ error: "Invalid user data from GitHub" }, { status: 400 });
    }

    // Создание/обновление пользователя
    const user = await prisma.user.upsert({
      where: { email: primaryEmail },
      update: {
        githubId: userData.id.toString(),
        emailVerified: true,
        picture: userData.avatar_url,
        name: userData.name || userData.login,
      },
      create: {
        email: primaryEmail,
        name: userData.name || userData.login,
        githubId: userData.id.toString(),
        picture: userData.avatar_url,
        emailVerified: true,
        activeRefreshTokens: [],
      },
    });

    // Генерация JWT токенов
    const tokenId = randomUUID();
    const [accessJwt, refreshJwt] = await Promise.all([
      jwt.sign({ userId: user.id, jti: tokenId }, process.env.JWT_SECRET!, { expiresIn: "15m" }),
      jwt.sign({ userId: user.id, jti: tokenId, isRefresh: true }, process.env.JWT_SECRET!, {
        expiresIn: "7d",
      }),
    ]);

    // Обновление refresh токенов
    await prisma.user.update({
      where: { id: user.id },
      data: {
        activeRefreshTokens: {
          set: [...(user.activeRefreshTokens || []).slice(-4), tokenId],
        },
      },
    });

    // Работа с куками
    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax" as const,
    };

    cookieStore.set("token", accessJwt, { ...cookieOptions, maxAge: 15 * 60 });
    cookieStore.set("refreshToken", refreshJwt, { ...cookieOptions, maxAge: 60 * 60 * 24 * 7 });

    // Создаем редирект и чистим временные куки
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}`);
    response.cookies.delete("oauth_state");
    response.cookies.delete("oauth_code_verifier");

    return response;
  } catch (error) {
    console.error("GitHub OAuth error:", error);

    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=github_auth_failed`
    );

    // Очищаем все куки при ошибке
    response.cookies.delete("oauth_state");
    response.cookies.delete("oauth_code_verifier");
    response.cookies.delete("token");
    response.cookies.delete("refreshToken");

    return response;
  }
}

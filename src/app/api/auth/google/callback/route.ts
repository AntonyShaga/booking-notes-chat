// app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    if (!code) {
      return NextResponse.json({ error: "Authorization code is required" }, { status: 400 });
    }

    // Обмен code на токены
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
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

    const {
      email,
      name,
      picture,
      sub: googleId,
    } = jwtDecode<{
      email: string;
      name: string;
      picture?: string;
      sub: string;
    }>(idToken);

    if (!email || !name || !googleId) {
      return NextResponse.json({ error: "Incomplete user data from Google" }, { status: 400 });
    }

    // Создание/обновление пользователя
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        googleId,
        emailVerified: true,
        picture: picture || undefined, // Обновляем аватар, только если он есть
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

    // Генерация токенов
    const jwtSecret = process.env.JWT_SECRET!;
    const tokenId = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      jwt.sign({ userId: user.id, jti: tokenId }, jwtSecret, { expiresIn: "15m" }),
      jwt.sign({ userId: user.id, jti: tokenId, isRefresh: true }, jwtSecret, { expiresIn: "7d" }),
    ]);

    // Сохраняем refreshToken ID в базе
    await prisma.user.update({
      where: { id: user.id },
      data: {
        activeRefreshTokens: { push: tokenId },
      },
    });

    // Устанавливаем куки
    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict" as const,
    };

    cookieStore.set("token", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60, // 15 минут
    });

    cookieStore.set("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: "/",
    });

    // Редирект на главную с security headers
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}`);
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    return response;
  } catch (error) {
    console.error("Google authentication error:", error);

    // Редирект на страницу входа с сообщением об ошибке
    const redirectUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/login`);
    redirectUrl.searchParams.set("error", "google_auth_failed");

    return NextResponse.redirect(redirectUrl);
  }
}

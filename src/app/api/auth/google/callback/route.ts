// app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { randomUUID, randomBytes, createHash } from "crypto";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");

    // Получаем сохраненные state и code_verifier из cookies
    const cookieState = req.cookies.get("oauth_state")?.value;
    const codeVerifier = req.cookies.get("code_verifier")?.value;

    // Проверяем обязательные параметры
    if (!code) {
      return NextResponse.json({ error: "Authorization code is required" }, { status: 400 });
    }

    // Валидация state для защиты от CSRF
    if (!state || !cookieState || state !== cookieState) {
      return NextResponse.json({ error: "Invalid state parameter" }, { status: 400 });
    }

    // Обмен code на токены с использованием PKCE
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
        code_verifier: codeVerifier!, // Добавляем code_verifier для PKCE
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

    // Декодируем и валидируем ID токен
    const decodedToken = jwtDecode<{
      email: string;
      name: string;
      picture?: string;
      sub: string;
      aud: string;
      iss: string;
    }>(idToken);

    const { email, name, picture, sub: googleId, aud, iss } = decodedToken;

    // Проверяем обязательные поля
    if (!email || !name || !googleId) {
      return NextResponse.json({ error: "Incomplete user data from Google" }, { status: 400 });
    }

    // Валидация аудитории и издателя токена
    if (aud !== process.env.GOOGLE_CLIENT_ID) {
      return NextResponse.json({ error: "Invalid token audience" }, { status: 400 });
    }

    if (iss !== "https://accounts.google.com" && iss !== "accounts.google.com") {
      return NextResponse.json({ error: "Invalid token issuer" }, { status: 400 });
    }

    // Создание/обновление пользователя
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

    // Генерация токенов
    const jwtSecret = process.env.JWT_SECRET!;
    const tokenId = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      jwt.sign({ userId: user.id, jti: tokenId }, jwtSecret, { expiresIn: "15m" }),
      jwt.sign({ userId: user.id, jti: tokenId, isRefresh: true }, jwtSecret, { expiresIn: "7d" }),
    ]);

    // Сохраняем refreshToken ID в базе (ограничиваем количество активных токенов)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        activeRefreshTokens: {
          // Оставляем только 5 последних refresh токенов
          set: [...(user.activeRefreshTokens || []).slice(-4), tokenId],
        },
      },
    });

    // Устанавливаем куки
    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax" as const, // Изменено на lax для лучшей совместимости
    };

    cookieStore.set("token", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60, // 15 минут
    });

    cookieStore.set("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7, // 7 дней
    });

    // Редирект на главную с security headers
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}`);

    // Очищаем временные cookies
    response.cookies.delete("oauth_state");
    response.cookies.delete("code_verifier");

    // Устанавливаем security headers
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    return response;
  } catch (error) {
    console.error("Google authentication error:", error);

    // Редирект на страницу входа с сообщением об ошибке
    const redirectUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/login`);
    redirectUrl.searchParams.set("error", "google_auth_failed");

    const response = NextResponse.redirect(redirectUrl);
    // Очищаем временные cookies в случае ошибки
    response.cookies.delete("oauth_state");
    response.cookies.delete("code_verifier");

    return response;
  }
}

import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "No code" }, { status: 400 });

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

  const tokens = await tokenRes.json();
  const idToken = tokens.id_token;
  if (!idToken) return NextResponse.json({ error: "No id_token" }, { status: 400 });

  const {
    email,
    name,
    picture,
    sub: googleId,
  } = jwtDecode(idToken) as {
    email: string;
    name: string;
    picture?: string;
    sub: string;
  };

  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    if (!user.googleId) {
      // Привязываем Google-аккаунт
      user = await prisma.user.update({
        where: { email },
        data: {
          googleId,
          emailVerified: true,
        },
      });
    }
  } else {
    // Создаем нового пользователя
    user = await prisma.user.create({
      data: {
        email,
        name,
        picture,
        googleId,
        emailVerified: true,
        activeRefreshTokens: [],
      },
    });
  }
  // Генерация токенов
  const jwtSecret = process.env.JWT_SECRET!;
  const tokenId = randomUUID();

  const payload = {
    userId: user.id,
    jti: tokenId,
  };

  const [accessToken, refreshToken] = await Promise.all([
    jwt.sign(payload, jwtSecret, { expiresIn: "15m" }),
    jwt.sign({ ...payload, isRefresh: true }, jwtSecret, { expiresIn: "7d" }),
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
  };

  cookieStore.set("token", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60,
    sameSite: "strict",
  });

  cookieStore.set("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 7,
    path: "/api/auth/refresh",
  });

  // Редирект на главную
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}`);
}

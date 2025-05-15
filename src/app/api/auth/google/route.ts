// app/api/auth/google/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!, // твой OAuth Client ID
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`, // куда Google вернет
    response_type: "code", // нужно получить код авторизации
    scope: "openid email profile", // доступ к email, профилю, id_token
    access_type: "offline", // даст refresh_token
    prompt: "consent", // всегда показывает выбор аккаунта
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

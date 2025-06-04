import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Пропускаем публичные страницы
  if (
    pathname === "/" ||
    pathname === "/signin" ||
    pathname === "/signup" ||
    pathname === "/verify-email" ||
    pathname === "/2fa"
  ) {
    return NextResponse.next();
  }

  // Пытаемся получить accessToken из cookie
  const token = req.cookies.get("token")?.value;
  console.log("token", token);
  // Если токена нет — редиректим на signin
  if (!token) {
    console.log("❌ Токен отсутствует");
    return NextResponse.redirect(new URL("/signin", req.url));
  }
  try {
    // Проверяем токен
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    console.log("secret", secret);
    const { payload } = await jwtVerify(token, secret);
    console.log("✅ JWT валиден", payload);
    return NextResponse.next();
  } catch (error) {
    console.error("❌ JWT ошибка:", error);
    return NextResponse.redirect(new URL("/signin", req.url));
  }
}

export const config = {
  matcher: [
    "/((?!api|_next|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|woff2|ttf|otf|eot)$|images/|icons/|fonts/).*)",
  ],
};

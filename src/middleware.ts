import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verify } from "jsonwebtoken";

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Пропускаем публичные страницы
  if (pathname === "/" || pathname === "/signin" || pathname === "/signup") {
    return NextResponse.next();
  }

  // Пытаемся получить accessToken из cookie
  const token = req.cookies.get("accessToken")?.value;

  // Если токена нет — редиректим на signin
  if (!token) {
    return NextResponse.redirect(new URL("/signin", req.url));
  }
  console.log("Access Token", token);
  try {
    // Проверяем токен
    verify(token, process.env.JWT_ACCESS_SECRET!);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/signin", req.url));
  }
}

export const config = {
  matcher: [
    "/((?!api|_next|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|woff2|ttf|otf|eot)$|images/|icons/|fonts/).*)",
  ],
};

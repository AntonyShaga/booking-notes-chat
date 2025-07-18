import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const publicPaths = ["/", "/signing", "/signup", "/verify-email", "/2fa"];
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;
  if (!token) {
    console.log("❌ Токен отсутствует");
    return NextResponse.redirect(new URL("/signing", req.url));
  }
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    const userRole = payload.role as string | undefined;
    console.log("✅ JWT валиден");

    if (pathname.startsWith("/dashboard") && userRole !== "admin") {
      console.warn("⛔ Доступ запрещён: недостаточно прав");
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("❌ JWT ошибка:", error);
    return NextResponse.redirect(new URL("/signing", req.url));
  }
}

export const config = {
  matcher: [
    "/((?!api|_next|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|woff2|ttf|otf|eot)$|images/|icons/|fonts/).*)",
  ],
};

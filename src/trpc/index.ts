import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { registerRouter } from "@/trpc/routers/register";
import { verifyEmailRouter } from "@/trpc/routers/verifyEmail";
import { refreshTokenRouter } from "@/trpc/routers/refresh-token";
import { logoutRouter } from "@/trpc/routers/logoutRouter";

export const appRouter = router({
  auth: authRouter,
  register: registerRouter,
  verifyEmail: verifyEmailRouter,
  refreshToken: refreshTokenRouter,
  logout: logoutRouter,
});

export type AppRouter = typeof appRouter;

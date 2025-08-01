import { router } from "./trpc";
import { getEmailStatusRout } from "@/trpc/routers/getEmailStatus";
import { registerRouter } from "@/trpc/routers/register";
import { verifyEmailRouter } from "@/trpc/routers/verifyEmail";
import { logoutRouter } from "@/trpc/routers/logoutRouter";
import { twoFARouter } from "@/trpc/routers/2fa/twoFARouter";
import { authRouter } from "@/trpc/routers/auth/auth";

export const appRouter = router({
  auth: authRouter,
  register: registerRouter,
  verifyEmail: verifyEmailRouter,
  getEmailStatus: getEmailStatusRout,
  logout: logoutRouter,
  twoFA: twoFARouter,
});

export type AppRouter = typeof appRouter;

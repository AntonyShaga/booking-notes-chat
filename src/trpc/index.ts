import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { registerRouter } from "@/trpc/routers/register";
import { verifyEmailRouter } from "@/trpc/routers/verifyEmail";
import { logoutRouter } from "@/trpc/routers/logoutRouter";
import { getEmailStatusRout } from "@/trpc/routers/getEmailStatus";
import { twoFARouter } from "@/trpc/routers/2fa";

export const appRouter = router({
  auth: authRouter,
  register: registerRouter,
  verifyEmail: verifyEmailRouter,
  logout: logoutRouter,
  getEmailStatus: getEmailStatusRout,
  twoFA: twoFARouter,
});

export type AppRouter = typeof appRouter;

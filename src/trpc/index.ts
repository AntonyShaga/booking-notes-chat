import { router } from "./trpc";
import { getEmailStatusRout } from "@/trpc/routers/getEmailStatus";
import { registerRouter } from "@/trpc/routers/register";
import { verifyEmailRouter } from "@/trpc/routers/verifyEmail";
import { logout } from "@/trpc/routers/logout";
import { twoFARouters } from "@/trpc/routers/2fa/twoFARouters";
import { authRouter } from "@/trpc/routers/auth/authRouters";

export const appRouter = router({
  auth: authRouter,
  register: registerRouter,
  verifyEmail: verifyEmailRouter,
  getEmailStatus: getEmailStatusRout,
  logout: logout,
  twoFA: twoFARouters,
});

export type AppRouter = typeof appRouter;

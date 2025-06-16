import { router } from "@/trpc/trpc";
import { loginRouter } from "@/trpc/routers/auth/login";
import { getCurrentUserRouter } from "@/trpc/routers/auth/getCurrentUser";
import { verify2FARouter } from "@/trpc/routers/auth/verify2FA";

export const authRouter = router({
  ...loginRouter,
  ...getCurrentUserRouter,
  ...verify2FARouter,
});

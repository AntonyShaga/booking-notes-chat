import { router } from "@/trpc/trpc";
import { loginRouter } from "@/trpc/routers/auth/login";
import { verify2FARouter } from "@/trpc/routers/auth/verify2FA";
import { getCurrentUserRouter } from "@/trpc/routers/auth/getCurrentUser";

export const authRouter = router({
  ...loginRouter,
  ...getCurrentUserRouter,
  ...verify2FARouter,
});

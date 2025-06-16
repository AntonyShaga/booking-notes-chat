import { router } from "@/trpc/trpc";
import { disable2FARouter } from "@/trpc/routers/2fa/disable2FA";
import { confirmRouter } from "@/trpc/routers/2fa/confirm";
import { statusRouter } from "@/trpc/routers/2fa/status";
import { requestRouter } from "@/trpc/routers/2fa/request";
import { setupRouter } from "@/trpc/routers/2fa/setup";

export const twoFARouter = router({
  ...setupRouter,
  ...requestRouter,
  ...statusRouter,
  ...confirmRouter,
  ...disable2FARouter,
});

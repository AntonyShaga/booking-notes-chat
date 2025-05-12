import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { registerRouter } from "@/trpc/routers/register";

export const appRouter = router({
  auth: authRouter,
  register: registerRouter,
});

export type AppRouter = typeof appRouter;

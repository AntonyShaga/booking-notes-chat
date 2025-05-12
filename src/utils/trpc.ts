import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import { AppRouter } from "@/trpc";

export const trpc = createTRPCReact<AppRouter>();
export { superjson };

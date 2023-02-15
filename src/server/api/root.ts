import { createTRPCRouter } from "./trpc";
import { usersRouter } from "./routers/users";
import { videoRouter } from "./routers/video";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  users: usersRouter,
  video: videoRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;

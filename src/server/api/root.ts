import { videoRouter } from './routers/video';
import { socialRouter } from './routers/social';
import { createTRPCRouter } from './trpc';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  video: videoRouter,
  social: socialRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;

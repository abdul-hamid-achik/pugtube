import { jobsRouter } from './routers/jobs';
import { socialRouter } from './routers/social';
import { videoRouter } from './routers/videos';
import { createTRPCRouter } from './trpc';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  videos: videoRouter,
  social: socialRouter,
  jobs: jobsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

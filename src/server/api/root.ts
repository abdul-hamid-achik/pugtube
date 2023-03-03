import { playlistRouter } from './routers/playlist';
import { uploadRouter } from './routers/upload';
import { videoRouter } from './routers/video';
import { createTRPCRouter } from './trpc';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  video: videoRouter,
  upload: uploadRouter,
  playlist: playlistRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;

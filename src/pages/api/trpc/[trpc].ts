import { createNextApiHandler } from '@trpc/server/adapters/next';

import { env } from '@/env/server.mjs';
import { createContext } from '@/server/api/context';
import { appRouter } from '@/server/api/root';

// export API handler
export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError:
    env.NODE_ENV === 'development'
      ? ({ path, error }) => {
        console.error(
          `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`,
        );
      }
      : undefined,
});

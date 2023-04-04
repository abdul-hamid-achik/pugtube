import { createNextApiHandler } from "@trpc/server/adapters/next";
import { createContext } from "@/server/api/context";
import { appRouter } from "@/server/api/root";
import log from "@/utils/logger";
// export API handler
export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError:
    process.env.NODE_ENV === "development"
      ? ({ path, error }) => {
          log.error(
            `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
          );
        }
      : undefined,
});

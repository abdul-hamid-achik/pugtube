import { prisma } from "@/server/db";
import type {
  SignedInAuthObject,
  SignedOutAuthObject,
} from "@clerk/nextjs/dist/api";
import { getAuth } from "@clerk/nextjs/server";
import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";

interface AuthContext {
  auth: SignedInAuthObject | SignedOutAuthObject;
}

export const createContextInner = async ({ auth }: AuthContext) => {
  return {
    auth,
    prisma,
  };
};

export const createContext = async (
  opts: trpcNext.CreateNextContextOptions
) => {
  return await createContextInner({ auth: getAuth(opts.req) });
};

export type Context = trpc.inferAsyncReturnType<typeof createContext>;

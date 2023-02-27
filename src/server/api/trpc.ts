import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';

import { type Context } from './context';


const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;


const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.auth.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      auth: ctx.auth,
    },
  })
})

export const protectedProcedure = t.procedure.use(isAuthed);



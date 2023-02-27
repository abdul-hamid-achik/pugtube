import { createTRPCRouter, publicProcedure } from '@/server/api/trpc';
import * as z from 'zod';

export const usersRouter = createTRPCRouter({
  getUser: publicProcedure.input(
    z.object({
      id: z.string(),
    })
  ).query(async ({ input: { id }, ctx }) => await ctx.prisma.user.findUnique({
    where: {
      id,
    },

    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },

    rejectOnNotFound: true,
  })),
});

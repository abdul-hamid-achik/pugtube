import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const uploadRouter = createTRPCRouter({
    getById: publicProcedure.input(z.string()).query(({ ctx, input }) => {
        return ctx.prisma.upload.findUniqueOrThrow({
            where: {
                id: input,
            },
        })
    }),
});

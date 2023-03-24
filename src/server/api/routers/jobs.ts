import queue from '@/server/queue';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const jobsRouter = createTRPCRouter({
    enqueue: protectedProcedure.input(z.object({
        name: z.string(),
        payload: z.object({
            uploadId: z.string().uuid().optional(),
            fileName: z.string().optional(),
            quality: z.enum(['hd', 'sd']).optional(),
        }),
    })).mutation(async ({ ctx, input }) => {
        const { payload, name } = input;
        return await queue.add(name, payload);
    }),


    job: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
        const job = await queue.getJob(input);

        return job;
    }),
});

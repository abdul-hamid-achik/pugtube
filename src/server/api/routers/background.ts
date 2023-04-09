import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Job } from "bullmq";

export const backgroundRouter = createTRPCRouter({
  enqueue: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        payload: z.object({
          uploadId: z.string().uuid().optional(),
          fileName: z.string().optional(),
          quality: z.enum(["hd", "sd"]).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { payload, name } = input;
      return await ctx.queue.add(name, payload);
    }),

  job: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return await ctx.queue.getJob(input);
  }),

  jobs: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string()).optional(),
        states: z
          .array(
            z.enum([
              "completed",
              "failed",
              "active",
              "delayed",
              "waiting",
              "waiting-children",
              "paused",
              "repeat",
              "wait",
            ])
          )
          .optional(),

        start: z.number().optional(),
        end: z.number().optional(),
        asc: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let jobs: Job[] = [];

      if (input.ids)
        jobs = (await Promise.all(
          input.ids.map(async (id) => await ctx.queue.getJob(id))
        )) as Job[];

      if (input.states)
        jobs = await ctx.queue.getJobs(
          input.states,
          input.start,
          input.end,
          input.asc || false
        );

      return await Promise.all(
        jobs.map(async (job) => ({
          id: job.id,
          queueName: job.queueName,
          name: job.name,
          data: job.data,
          progress: job.progress,
          finishedOn: job.finishedOn,
          processedOn: job.processedOn,
          delay: job.opts.delay,
          attempts: job.opts.attempts,
          backoff: job.opts.backoff,
          timestamp: job.timestamp / 1000,
          failedReason: job.failedReason,
          stacktrace: job.stacktrace,
          returnvalue: job.returnvalue,
          state: await job.getState(),
        }))
      );
    }),

  remove: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return await ctx.queue.remove(input);
    }),

  pause: protectedProcedure.mutation(async ({ ctx }) => {
    return await ctx.queue.pause();
  }),

  resume: protectedProcedure.mutation(async ({ ctx }) => {
    return await ctx.queue.resume();
  }),
});

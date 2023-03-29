import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

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
    .input(z.array(z.string()))
    .query(async ({ ctx, input }) => {
      return await Promise.all(
        input.map(async (id) => await ctx.queue.getJob(id))
      );
    }),
});

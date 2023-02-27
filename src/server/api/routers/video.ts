import type { Video } from '@prisma/client';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';

export const videoRouter = createTRPCRouter({
  getAll: publicProcedure.input(
    z.object({
      page: z.number().int().optional(),
      perPage: z.number().int().optional(),
    }),
  ).query(({ ctx, input }) => {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 10;
    return ctx.prisma.video.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * perPage,
      take: perPage,
    });
  }),

  create: protectedProcedure.input(z.object({
    upload: z.object({
      id: z.string().uuid(),
    }),
    title: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    duration: z.number().optional(),
    thumbnailUrl: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const video: Video = await ctx.prisma.video.create({
      data: {
        ...input,
        userId: ctx.auth.userId as string,
        upload: {
          connect: {
            id: input.upload.id,
          },
        },
      },
      include: {
        upload: true,
      },
    });

    return video;
  }),

  update: protectedProcedure.input(z.object({
    id: z.string().uuid(),
    title: z.string(),
    duration: z.number(),
  })).mutation(async ({ ctx, input }) => {

    const video = await ctx.prisma.video.update({
      where: {
        id: input.id,
      },
      data: {
        ...input,
        userId: ctx.auth?.userId as string,
      },
    });

    return video;
  }),
});

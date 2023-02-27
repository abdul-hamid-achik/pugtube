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

    if (!input.upload.id) {
      throw new Error('No original upload id provided');
    }

    const userId = ctx.auth.userId;

    const video: Video = await ctx.prisma.video.create({
      data: {
        ...input,
        upload: {
          connect: {
            id: input.upload.id,
          },
        },
        author: {
          connect: {
            id: userId,
          },
        }
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
    const userId = ctx.auth?.user?.id;

    const video = await ctx.prisma.video.update({
      where: {
        id: input.id,
      },
      data: {
        ...input,
        author: {
          connect: {
            id: userId,
          },
        },
      },
    });

    return video;
  }),
});

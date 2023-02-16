import type { Video } from '@prisma/client';
import { getSession } from 'next-auth/react';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const videoRouter = createTRPCRouter({
  getAll: publicProcedure.query(({ ctx }) => ctx.prisma.video.findMany({
    orderBy: {
      // createdAt: "desc"
    },
  })),

  create: publicProcedure.input(z.object({
    originalUpload: z.object({
      id: z.string().uuid(),
    }),
    title: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    duration: z.number().optional(),
    thumbnailUrl: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const session = await getSession();
    if (!session) {
      // throw new Error("User is not authenticated");
      console.log('User is not authenticated');
    }

    console.log(input);

    if (!input.originalUpload.id) {
      throw new Error('No original upload id provided');
    }

    // const userId = session?.user?.id;

    const video: Video = await ctx.prisma.video.create({
      data: {
        ...input,
        originalUpload: {
          connect: {
            id: input.originalUpload.id,
          },
        },
      },
      include: {
        originalUpload: true,
      },
    });

    console.log(video);

    return video;
  }),

  update: publicProcedure.input(z.object({
    id: z.string().uuid(),
    title: z.string(),
    duration: z.number(),
  })).mutation(async ({ ctx, input }) => {
    const session = await getSession();
    if (!session) {
      throw new Error('User is not authenticated');
    }

    const userId = session?.user?.id;
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

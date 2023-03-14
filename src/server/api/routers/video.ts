import { getSignedUrl } from '@/utils/s3';
import { clerkClient } from '@clerk/nextjs/server';
import type { Video } from '@prisma/client';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';

export const videoRouter = createTRPCRouter({
  getByUploadId: publicProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.prisma.video.findUniqueOrThrow({
      where: {
        uploadId: input,
      },
    })
  }),

  feed: publicProcedure.input(z.object({
    limit: z.number().min(1).max(100).nullish(),
    cursor: z.string().nullish(),
    skip: z.number().optional()
  })
  ).query(async ({ ctx, input }) => {
    const limit = input.limit ?? 9;
    const { cursor, skip } = input;
    let videos = await ctx.prisma.video.findMany({
      take: limit + 1,
      skip,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    })
    videos = await Promise.all(videos.map(async (video: Video) => ({ ...video, thumbnailUrl: video.thumbnailUrl ? await getSignedUrl(video.thumbnailUrl as string) : null })));

    const authors = await clerkClient.users.getUserList({
      userId: videos.map((video) => video.userId),
    });

    const items = videos.map((video) => ({
      video,
      author: authors.find((author) => author.id === video.userId)!,
    }));

    let nextCursor: typeof cursor | undefined = undefined;
    if (items.length > limit) {
      const nextItem = items.pop()
      nextCursor = nextItem!.video!.id;
    }

    return {
      items,
      nextCursor,
    };

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

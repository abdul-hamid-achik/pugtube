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

  getAll: publicProcedure.input(
    z.object({
      page: z.number().int().optional(),
      perPage: z.number().int().optional(),
    }),
  ).query(async ({ ctx, input }) => {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 10;
    let videos = await ctx.prisma.video.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * perPage,
      take: perPage,
    })
    videos = await Promise.all(videos.map(async (video: Video) => ({ ...video, thumbnailUrl: video.thumbnailUrl ? await getSignedUrl(video.thumbnailUrl as string) : null })));

    const authors = await clerkClient.users.getUserList({
      userId: videos.map((video) => video.userId),
    });

    const videosWithAuthor = videos.map((video) => ({
      video,
      author: authors.find((author) => author.id === video.userId)!,
    }));

    return videosWithAuthor;
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

import queue from '@/server/queue';
import { getSignedUrl } from '@/utils/s3';
import { clerkClient } from '@clerk/nextjs/server';
import type { Video } from '@prisma/client';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';

import { env } from '@/env/server.mjs';
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
      where: {
        upload: {
          transcoded: true
        }
      }
    })

    videos = await Promise.all(videos.map(async (video: Video) => ({ ...video, thumbnailUrl: video.thumbnailUrl ? await getSignedUrl(video.thumbnailUrl as string) : null })));

    const authors = await clerkClient.users.getUserList({
      userId: videos.map((video) => video.userId),
    });

    const items = videos.map((video) => ({
      video,
      author: authors.find((author) => author.id === video.userId)!,
    }));
    // @ts-ignore
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
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    thumbnailUrl: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {

    const video = await ctx.prisma.video.update({
      where: {
        id: input.id,
      },
      data: {
        ...input,
        thumbnailUrl: input.thumbnailUrl?.startsWith('https://') || input.thumbnailUrl?.startsWith('http://') ?
          input.thumbnailUrl :
          `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${input.thumbnailUrl}`,
      },
    });

    return video;
  }),

  delete: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const video = await ctx.prisma.video.findUnique({
      where: {
        id: input,
      },
      include: {
        upload: true,
        hlsPlaylist: true,
      },
    })!;


    await ctx.prisma.video.delete({
      where: {
        id: input,
      },
    });

    await ctx.prisma.upload.delete({
      where: {
        id: video?.upload.id,
      },
    });

    await ctx.prisma.videoMetadata.delete({
      where: {
        id: video?.upload?.metadataId as string,
      },
    });

    await ctx.prisma.hlsPlaylist.findUnique({
      where: {
        id: video?.hlsPlaylist?.id as string,
      },
    });

    await ctx.prisma.hlsSegment.deleteMany({
      where: {
        playlistId: video?.hlsPlaylist?.id as string,
      },
    });

    queue.add('delete-video-artifacts', {
      videoId: video?.id,
      uploadId: video?.upload?.id
    })


    return video;
  }),

  getUploadById: publicProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.prisma.upload.findUniqueOrThrow({
      where: {
        id: input,
      },
    })
  }),

  getPlaylistSegmentsByUploadId: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const video = await ctx.prisma.video.findUniqueOrThrow({
      where: {
        uploadId: input,
      },
      include: {
        hlsPlaylist: true,
      }
    })

    const segments = await ctx.prisma.hlsSegment.findMany({
      where: {
        videoId: video.id,
      },
    })

    return segments || [];
  }),

  search: publicProcedure
    .input(
      z.object({
        searchTerm: z.string(),
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        skip: z.number().optional()
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 5;
      const searchTerm = input.searchTerm;
      const cursor = input.cursor;

      let videos = await ctx.prisma.video.findMany({
        take: limit + 1,
        skip: input.skip || 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: 'desc',
        },
        where: {
          OR: [
            {
              title: {
                contains: searchTerm,
              },
            },
            {
              description: {
                contains: searchTerm,
              },
            },
            {
              category: {
                contains: searchTerm,
              },
            },
          ],
          upload: {
            transcoded: true,
          },
        },
      });
      videos = await Promise.all(
        videos.map(async (video: Video) => ({
          ...video,
          thumbnailUrl: video.thumbnailUrl
            ? await getSignedUrl(video.thumbnailUrl as string)
            : null,
        })),
      );

      const authors = await clerkClient.users.getUserList({
        userId: videos.map((video) => video.userId),
      });

      const items = videos.map((video) => ({
        video,
        author: authors.find((author) => author.id === video.userId)!,
      }));

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.video!.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

});


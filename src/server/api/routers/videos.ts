import { env } from "@/env.mjs";
import * as shared from "@/utils/shared";
import type { Video } from "@prisma/client";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const videoRouter = createTRPCRouter({
  video: publicProcedure
    .input(
      z.object({
        uploadId: z.string().uuid().optional(),
        videoId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!input.uploadId && !input.videoId) {
        throw new Error("Must provide either uploadId or videoId");
      }
      if (input.uploadId) {
        const video = await ctx?.prisma?.video.findUniqueOrThrow({
          where: {
            uploadId: input.uploadId,
          },
          select: {
            id: true,
          },
        });

        return await shared.getVideoData(video.id, ctx);
      }

      return await shared.getVideoData(input.videoId!, ctx);
    }),

  feed: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        skip: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await shared.getFeed({
        limit: input.limit,
        cursor: input.cursor,
        skip: input.skip,
        ctx,
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        upload: z.object({
          id: z.string().uuid(),
        }),
        title: z.string(),
        description: z.string().optional(),
        category: z.string().optional(),
        duration: z.number().optional(),
        thumbnailUrl: z.string().optional(),
        previewUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().optional(),
        category: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        previewUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.video.update({
        where: {
          id: input.id,
        },
        data: {
          ...input,
          thumbnailUrl:
            input.thumbnailUrl?.startsWith("https://") ||
            input.thumbnailUrl?.startsWith("http://")
              ? input.thumbnailUrl
              : `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_S3_REGION}.amazonaws.com/${input.thumbnailUrl}`,

          previewUrl:
            input.previewUrl?.startsWith("https://") ||
            input.previewUrl?.startsWith("http://")
              ? input.previewUrl
              : `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_S3_REGION}.amazonaws.com/${input.previewUrl}`,
        },
      });
    }),

  search: publicProcedure
    .input(
      z.object({
        searchTerm: z.string(),
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        skip: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await shared.getSearchResults({
        limit: input.limit,
        cursor: input.cursor,
        skip: input.skip,
        searchTerm: input.searchTerm,
        ctx,
      });
    }),
});

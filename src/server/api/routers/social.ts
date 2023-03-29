import * as shared from "@/utils/shared";
import { User } from "@clerk/nextjs/api";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { clerkClient } from "@clerk/nextjs/server";

export const socialRouter = createTRPCRouter({
  author: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return await clerkClient.users.getUser(input);
  }),
  comments: publicProcedure
    .input(
      z.object({
        videoId: z.string(),
        limit: z.number().min(1).max(100).optional(),
        cursor: z.string().optional(),
        skip: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await shared.getComments({
        videoId: input.videoId,
        limit: input.limit,
        cursor: input.cursor,
        skip: input.skip,
        ctx,
      });
    }),

  comment: protectedProcedure
    .input(
      z.object({
        videoId: z.string().optional(),
        commentId: z.string().optional(),
        text: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const data: Prisma.CommentCreateInput = {
        text: input.text,
        userId: ctx.auth.userId as string,
      };

      if (input.videoId) {
        data.video = { connect: { id: input.videoId } };
      } else if (input.commentId) {
        data.parentComment = { connect: { id: input.commentId } };
      } else {
        throw new Error("Either videoId or commentId must be provided");
      }

      const comment = await ctx.prisma.comment.create({ data });

      return {
        comment,
        author: ctx.auth.user as User,
      };
    }),

  like: protectedProcedure
    .input(
      z.object({
        commentId: z.string().optional(),
        videoId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let data: Prisma.LikeCreateInput = {
        userId: ctx.auth.userId as string,
      };

      if (input.commentId) {
        data = {
          ...data,
          comment: { connect: { id: input.commentId } },
        };
      }

      if (input.videoId) {
        data = {
          ...data,
          video: { connect: { id: input.videoId } },
        };
      }

      return await ctx.prisma.like.create({
        data,
      });
    }),

  getLike: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return await ctx.prisma.like.findUniqueOrThrow({
      where: {
        id: input,
      },
    });
  }),

  unlike: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.like.delete({
        where: {
          id: input,
        },
      });
    }),

  likes: publicProcedure
    .input(
      z.object({
        videoId: z.string().optional(),
        commentId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await shared.getLikes({
        videoId: input.videoId,
        commentId: input.commentId,
        ctx,
      });
    }),
});

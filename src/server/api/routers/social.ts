import { User } from '@clerk/nextjs/api';
import { clerkClient } from '@clerk/nextjs/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';

export const socialRouter = createTRPCRouter({
    getCommentsForVideo: publicProcedure.input(
        z.object({
            videoId: z.string(),
            limit: z.number().min(1).max(100).optional(),
            cursor: z.string().optional(),
        })
    ).query(async ({ ctx, input }) => {
        const limit = input.limit ?? 9;
        const comments = await ctx.prisma.comment.findMany({
            where: {
                videoId: input.videoId,
            },
            take: limit + 1,
            cursor: input.cursor ? { id: input.cursor } : undefined,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                parentComment: true,
            },
        });

        const authors = await clerkClient.users.getUserList({
            userId: comments.map((comment) => comment.userId),
        });

        let nextCursor: string | null = null;
        if (comments.length > limit) {
            const nextComment = comments.pop();
            nextCursor = nextComment!.id;
        }

        return {
            items: comments.map((comment) => ({
                comment,
                author: authors.find((author) => author.id === comment.userId)!,
                parentComment: comment.parentComment
                    ? {
                        ...comment.parentComment,
                        author: authors.find(
                            (author) => author.id === comment.parentComment!.userId
                        )!,
                    }
                    : null,
            })) || [],
            nextCursor,
        };
    }),


    addCommentToVideo: protectedProcedure.input(
        z.object({
            videoId: z.string().optional(),
            commentId: z.string().optional(),
            text: z.string(),
        })
    ).mutation(async ({ ctx, input }) => {
        const data: Prisma.CommentCreateInput = {
            text: input.text,
            userId: ctx.auth.userId as string,
        };

        if (input.videoId) {
            data.video = { connect: { id: input.videoId } };
        } else if (input.commentId) {
            data.parentComment = { connect: { id: input.commentId } };
        } else {
            throw new Error('Either videoId or commentId must be provided');
        }

        const comment = await ctx.prisma.comment.create({ data });


        return {
            comment,
            author: ctx.auth.user as User,
        };
    }),


});

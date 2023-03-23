import { User } from '@clerk/nextjs/api';
import { clerkClient } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const videoRouter = createTRPCRouter({
    getCommentsForVideo: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
        const comments = await ctx.prisma.comment.findMany({
            where: {
                videoId: input,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const authors = await clerkClient.users.getUserList({
            userId: comments.map((comment) => comment.userId),
        });

        return comments.map((comment) => ({
            comment,
        }));
    }),

    addCommentToVideo: publicProcedure.input(z.object({
        videoId: z.string(),
        text: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const comment = await ctx.prisma.comment.create({
            data: {
                text: input.text,
                videoId: input.videoId,
                userId: ctx.auth.userId as string,
            },
        });



        return {
            comment,
            author: ctx.auth.user as User,
        };
    }
    ),

});

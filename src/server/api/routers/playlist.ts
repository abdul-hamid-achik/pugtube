import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const playlistRouter = createTRPCRouter({
    getSegmentsByUploadId: publicProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
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
});

import { prisma } from '@/server/db';
import { getSignedUrl } from '@/utils/s3';
import { clerkClient } from "@clerk/nextjs/server";

export async function getVideoData(videoId: string) {
    const video = await prisma.video.findFirst({
        where: { id: String(videoId) },
        include: {
            upload: true,
        },
    });
    const author = await clerkClient.users.getUser(video?.userId as string);

    const like = await prisma.like.findFirst({
        where: {
            videoId: videoId,
            userId: author.id,
        },
    });

    return {
        video: {
            ...video,
            thumbnailUrl: video?.thumbnailUrl ? await getSignedUrl(video?.thumbnailUrl as string) : '',
        },
        like,
        author
    }
}

import { prisma } from '@/server/db';
import { deleteObject } from '@/utils/s3';
import { log } from 'next-axiom';
export default async function deleteVideoArtifacts({ videoId }: { videoId: string }) {
    log.debug(`Deleting video artifacts for video ID: ${videoId}...`)

    const video = await prisma.video.findUnique({
        where: {
            id: videoId,
        },
        include: {
            upload: {
                include: {
                    metadata: true,
                }
            },
            hlsPlaylist: {
                include: {
                    segments: true,
                }
            },
        },
    });

    const segments = video?.hlsPlaylist?.segments || [];

    log.debug(`Deleting original, thumbnail, and transcoded segments...`)

    await deleteObject(`https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/originals/${video?.upload?.id}/${video?.upload?.metadata?.fileName}`);
    await deleteObject(`https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/thumbnails/${video?.upload?.id}/${video?.id}.png`);
    await Promise.all(segments.map((_, index) =>
        deleteObject(`https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/transcoded/${video?.upload?.id}/segment-${index}.ts`)
    ))
    await deleteObject(`https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/transcoded/${video?.upload?.id}/output.m3u8`);
    await deleteObject(`https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${video?.upload?.id}`);
    log.debug(`Deleting video, upload, metadata, segments, and playlist...`)


    await prisma.video.delete({
        where: {
            id: videoId,
        },
    });

    await prisma.upload.delete({
        where: {
            id: video?.upload.id,
        },
    });

    await prisma.videoMetadata.delete({
        where: {
            id: video?.upload?.metadataId as string,
        },
    });

    await prisma.hlsSegment.deleteMany({
        where: {
            playlistId: video?.hlsPlaylist?.id as string,
        },
    });

    await prisma.hlsPlaylist.delete({
        where: {
            id: video?.hlsPlaylist?.id as string,
        },
    });

    log.debug(`Deleted video artifacts for video ID: ${videoId}...`)
}

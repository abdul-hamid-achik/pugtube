import { prisma } from "@/server/db";
import { deleteObject } from "@/utils/s3";
import log from "@/utils/logger";
import { env } from "@/env/server.mjs";

export default async function deleteVideoArtifacts({
  videoId,
}: {
  videoId: string;
}) {
  log.debug(`Deleting video artifacts for video ID: ${videoId}...`);

  const video = await prisma.video.findUnique({
    where: {
      id: videoId,
    },
    include: {
      thumbnails: {
        include: {
          contentTags: true,
        },
      },
      upload: {
        include: {
          metadata: true,
        },
      },
      hlsPlaylist: {
        include: {
          segments: true,
        },
      },
    },
  });

  const segments = video?.hlsPlaylist?.segments || [];
  const thumbnails = video?.thumbnails || [];

  log.debug(`Deleting original, thumbnail, and transcoded segments...`);

  await deleteObject({
    Bucket: env.AWS_S3_BUCKET as string,
    Key: `originals/${video?.upload?.id}/${video?.upload?.metadata?.fileName}`,
  });

  await deleteObject({
    Bucket: env.AWS_S3_BUCKET as string,
    Key: `thumbnails/${video?.upload?.id}.png`,
  });

  await deleteObject({
    Bucket: env.AWS_S3_BUCKET as string,
    Key: `previews/${video?.upload?.id}.gif`,
  });

  await Promise.all(
    thumbnails.map((thumbnail) =>
      deleteObject({
        Bucket: env.AWS_S3_BUCKET as string,
        Key: thumbnail.key,
      })
    )
  );

  await Promise.all(
    segments.map((_, index) =>
      deleteObject({
        Bucket: env.AWS_S3_BUCKET as string,
        Key: `transcoded/${video?.upload?.id}/segment-${index}.ts`,
      })
    )
  );
  await deleteObject({
    Bucket: env.AWS_S3_BUCKET as string,
    Key: `transcoded/${video?.upload?.id}/playlist.m3u8`,
  });
  await deleteObject({
    Bucket: env.AWS_S3_BUCKET as string,
    Key: video?.upload?.id as string,
  });
  log.debug(`Deleting video, upload, metadata, segments, and playlist...`);

  if (video?.hlsPlaylist) {
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
  }

  await prisma.contentTag.deleteMany({
    where: {
      thumbnailId: {
        in: thumbnails.map((thumbnail) => thumbnail.id),
      },
    },
  });

  await prisma.thumbnail.deleteMany({
    where: {
      videoId: videoId,
    },
  });

  await prisma.video.delete({
    where: {
      id: videoId,
    },
  });

  if (video?.upload) {
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
  }
  log.debug(`Deleted video artifacts for video ID: ${videoId}...`);
}

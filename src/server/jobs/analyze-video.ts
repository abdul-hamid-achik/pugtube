import { log } from "@/utils/logger";
import { getObject } from "@/utils/s3";
import { prisma } from "@/server/db";
import { type Tensor3D } from "@tensorflow/tfjs-node";
import type { Prisma } from "@prisma/client";
import { streamToBuffer } from "@/utils/ffmpeg";
import { Readable } from "stream";

export default async function analyzeVideo({
  uploadId,
  fileName,
}: {
  uploadId: string;
  fileName: string;
}) {
  const { load: loadMobilenet } = await import("@tensorflow-models/mobilenet");
  const { node: tfnode, dispose } = await import("@tensorflow/tfjs-node");
  const model = await loadMobilenet({
    version: 2,
    alpha: 1,
  });
  const { id: videoId, thumbnails } = await prisma.video.findUniqueOrThrow({
    where: {
      uploadId,
    },
    select: {
      id: true,
      duration: true,
      thumbnails: {
        select: {
          id: true,
          key: true,
          contentTags: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const contentTagsData: Prisma.ContentTagCreateManyInput[] = [];
  log.info("found thumbnails", thumbnails);
  for (let i = 0; i < thumbnails.length; i++) {
    const thumbnail = await getObject({
      Bucket: process.env.AWS_S3_BUCKET as string,
      Key: thumbnails[i]!.key,
    });
    const thumbnailBuffer = await streamToBuffer(thumbnail!.Body as Readable);
    const tfimage = tfnode.decodeImage(
      new Uint8Array(thumbnailBuffer)
    ) as Tensor3D;
    // @ts-ignore
    const predictions = await model.classify(tfimage);

    log.debug("found predictions", predictions);
    predictions.forEach((prediction) => {
      contentTagsData.push({
        name: prediction.className,
        confidence: prediction.probability,
        thumbnailId: thumbnails[i]!.id,
      });
    });
  }

  log.debug("Saving contentTags to db", [contentTagsData]);

  await prisma.contentTag.createMany({
    data: contentTagsData,
    skipDuplicates: true,
  });

  await prisma.video.update({
    where: {
      id: videoId,
    },
    data: {
      analyzedAt: new Date(),
    },
  });
  dispose();
}

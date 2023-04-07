import { prisma } from "@/server/db";
import { getObject, getSignedUrl, streamToBuffer } from "@/utils/s3";
import log from "@/utils/logger";
import type { Prisma } from "@prisma/client";
import { type Tensor3D } from "@tensorflow/tfjs-node";
import Replicate from "replicate";
import { Readable } from "stream";

import { env } from "@/env/server.mjs";

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

  const {
    id: videoId,
    thumbnails,
    premium,
  } = await prisma.video.findUniqueOrThrow({
    where: {
      uploadId,
    },
    select: {
      id: true,
      duration: true,
      premium: true,
      thumbnails: {
        select: {
          id: true,
          key: true,
          url: true,
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

  if (thumbnails.length === 0) {
    throw Error("No thumbnails found");
  }

  log.info("found thumbnails", thumbnails);
  for (let i = 0; i < thumbnails.length; i++) {
    const thumbnailId = thumbnails[i]!.id;
    const thumbnail = await getObject({
      Bucket: env.AWS_S3_BUCKET as string,
      Key: thumbnails[i]!.key,
    });
    const thumbnailBuffer = await streamToBuffer(thumbnail!.Body as Readable);
    const tfimage = tfnode.decodeImage(
      new Uint8Array(thumbnailBuffer)
    ) as Tensor3D;
    // @ts-ignore
    const predictions = await model.classify(tfimage);
    const replicateModelVersion =
      "de37751f75135f7ebbe62548e27d6740d5155dfefdf6447db35c9865253d7e06";
    const webhookUrl = `${
      process.env.NODE_ENV === "production"
        ? "https://pugtube.dev"
        : "https://tunnel.pugtube.dev"
    }/api/replicate/webhook/${thumbnailId}`;

    // only executing replicate if premium
    if (premium) {
      await new Replicate({
        auth: env.REPLICATE_API_TOKEN as string,
      }).predictions.create({
        version: replicateModelVersion,
        input: {
          image: await getSignedUrl(thumbnails[i]!.url),
        },
        webhook_completed: webhookUrl,
      });
    }

    log.debug("found mobilenet predictions", predictions);

    predictions
      .map((preduction) =>
        preduction.className.split(",").map((name) => ({
          name,
          confidence: preduction.probability,
          thumbnailId: thumbnailId,
        }))
      )
      .flat()
      .forEach((prediction) => {
        contentTagsData.push(prediction);
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

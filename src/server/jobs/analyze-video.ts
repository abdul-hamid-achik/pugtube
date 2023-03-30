import { createFFmpeg, streamToBuffer } from "@/utils/ffmpeg";
import { log } from "@/utils/logger";
import { getObject, putObject } from "@/utils/s3";
import { load as loadMobilenet } from "@tensorflow-models/mobilenet";
import { node as tfnode, type Tensor3D } from "@tensorflow/tfjs-node";
import { Readable } from "stream";
import { prisma } from "@/server/db";
import { v4 as uuid } from "uuid";
import type { Prisma } from "@prisma/client";

export default async function analyzeVideo({
  uploadId,
  fileName,
}: {
  uploadId: string;
  fileName: string;
}) {
  const ffmpeg = await createFFmpeg();
  const model = await loadMobilenet({
    version: 2,
    alpha: 1,
  });
  const { id: videoId, duration } = await prisma.video.findUniqueOrThrow({
    where: {
      uploadId,
    },
    select: {
      id: true,
      duration: true,
    },
  });

  const video = await getObject({
    Bucket: process.env.AWS_S3_BUCKET as string,
    Key: `originals/${uploadId}/${fileName}`,
  });

  const buffer = await streamToBuffer(video!.Body as Readable);
  ffmpeg.FS("writeFile", fileName, new Uint8Array(buffer));
  ffmpeg.FS("mkdir", "output");
  const thumbnailOutputFileName = `output/thumbnail-%01d.jpg`;

  await ffmpeg.run(
    "-i",
    fileName,
    "-filter:v",
    "thumbnail,fps=1",
    "-pix_fmt",
    "yuvj444p",
    thumbnailOutputFileName
  );

  const thumbnails = ffmpeg
    .FS("readdir", "output")
    .filter((file) => file.endsWith(".jpg"));
  const thumbnailsData: Prisma.ThumbnailCreateManyInput[] = [];
  const contentTagsData: Prisma.ContentTagCreateManyInput[] = [];
  log.info("found thumbnails", thumbnails);
  for (let i = 0; i < thumbnails.length; i++) {
    log.debug(`analyzing thumbnail ${i}/${thumbnails.length}`);
    const thumbnailFileName = thumbnails[i];
    const timestamp = thumbnailFileName!.split("-")[1]!.split(".")[0];

    const thumbnailBuffer = await ffmpeg.FS(
      "readFile",
      `output/${thumbnailFileName}`
    );

    const tfimage = tfnode.decodeImage(thumbnailBuffer) as Tensor3D;
    // @ts-ignore
    const predictions = await model.classify(tfimage);

    log.debug("found predictions", predictions);

    const thumbnailKey = `thumbnails/${thumbnailFileName}`;
    const fullThumbnailUrl = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${thumbnailKey}`;
    const thumbnailId = uuid();
    thumbnailsData.push({
      id: thumbnailId,
      timestamp: Number(timestamp), // TODO: calculate timestamp here
      url: fullThumbnailUrl,
      videoId: videoId,
    });

    predictions.forEach((prediction) => {
      contentTagsData.push({
        name: prediction.className,
        confidence: prediction.probability,
        thumbnailId: thumbnailId,
      });
    });

    await putObject({
      Bucket: process.env.AWS_S3_BUCKET as string,
      Key: thumbnailKey,
      Body: thumbnailBuffer,
      ContentType: "image/jpeg",
      ContentLength: thumbnailBuffer.length,
    });

    ffmpeg.FS("unlink", `output/${thumbnailFileName}`);
  }
  ffmpeg.FS("unlink", fileName);

  log.debug("Saving thumbnails and contentTags to db", [
    thumbnailsData,
    contentTagsData,
  ]);

  await prisma.thumbnail.createMany({
    data: thumbnailsData,
    skipDuplicates: true,
  });

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
  ffmpeg?.exit();
}

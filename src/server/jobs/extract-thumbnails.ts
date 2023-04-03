import { createFFmpeg, streamToBuffer } from "@/utils/ffmpeg";
import log from "@/utils/logger";
import { getObject, putObject } from "@/utils/s3";
import { Readable } from "stream";
import { prisma } from "@/server/db";
import { v4 as uuid } from "uuid";
import type { Prisma } from "@prisma/client";
import { env } from "@/env/server.mjs";

export default async function extractThumbnails({
  uploadId,
  fileName,
}: {
  uploadId: string;
  fileName: string;
}) {
  const ffmpeg = await createFFmpeg();

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
    Bucket: env.AWS_S3_BUCKET as string,
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

  log.info("found thumbnails", thumbnails);
  for (let i = 0; i < thumbnails.length; i++) {
    log.debug(`analyzing thumbnail ${i}/${thumbnails.length}`);
    const thumbnailFileName = thumbnails[i];
    const timestamp = thumbnailFileName!.split("-")[1]!.split(".")[0];

    const thumbnailBuffer = await ffmpeg.FS(
      "readFile",
      `output/${thumbnailFileName}`
    );

    const thumbnailKey = `thumbnails/${uploadId}-${thumbnailFileName}`;
    const fullThumbnailUrl = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_S3_REGION}.${env.AWS_S3_ENDPOINT}/${thumbnailKey}`;
    const thumbnailId = uuid();
    thumbnailsData.push({
      id: thumbnailId,
      timestamp: Number(timestamp), // TODO: calculate timestamp here
      url: fullThumbnailUrl,
      key: thumbnailKey,
      videoId: videoId,
    });

    await putObject({
      Bucket: env.AWS_S3_BUCKET as string,
      Key: thumbnailKey,
      Body: thumbnailBuffer,
      ContentType: "image/jpeg",
      ContentLength: thumbnailBuffer.length,
    });

    ffmpeg.FS("unlink", `output/${thumbnailFileName}`);
  }

  ffmpeg.FS("unlink", fileName);

  log.debug("Saving thumbnails to db", [thumbnailsData]);

  await prisma.thumbnail.createMany({
    data: thumbnailsData,
    skipDuplicates: true,
  });

  ffmpeg?.exit();
}

import log from "@/utils/logger";
import ffmpeg from "fluent-ffmpeg";
import { getObject, putObject } from "@/utils/s3";
import { prisma } from "@/server/db";
import { v4 as uuid } from "uuid";
import type { Prisma } from "@prisma/client";
import { env } from "@/env/server.mjs";
import os from "os";
import fs from "fs";
import { Readable } from "stream";
import { DateTime } from "luxon";

export default async function extractThumbnails({
  uploadId,
  fileName,
}: {
  uploadId: string;
  fileName: string;
}) {
  const outputFilesPath = `${os.tmpdir()}/${uploadId}/thumbnails`;

  if (!fs.existsSync(outputFilesPath)) {
    fs.mkdirSync(outputFilesPath, { recursive: true });
  }

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

  const outputFileName = `${outputFilesPath}/thumbnail-%01d.jpg`;
  await new Promise<void>((resolve, reject) => {
    ffmpeg(video!.Body as Readable)
      .outputOptions("-filter:v", "thumbnail,fps=1")
      .outputOptions("-pix_fmt", "yuvj444p")
      .output(outputFileName)
      .on("start", (commandLine: string) => {
        log.info("Spawned FFmpeg with command: " + commandLine);
      })
      .on(
        "progress",
        (progress: {
          frames: number;
          currentFps: number;
          currentKbps: number;
          targetSize: number;
          timemark: string;
        }) => {
          log.debug(progress.timemark);
        }
      )
      .on("error", (err: any) => {
        log.error(err);
        reject(err);
      })
      .on("end", () => {
        log.info("Finished processing");
        resolve();
      })
      .run();
  });

  const thumbnails = fs
    .readdirSync(outputFilesPath)
    .filter((file) => file.endsWith(".jpg"));
  const thumbnailsData: Prisma.ThumbnailCreateManyInput[] = [];

  log.info("found thumbnails", thumbnails);
  for (let i = 0; i < thumbnails.length; i++) {
    log.debug(`extracting thumbnail ${i}/${thumbnails.length}`);
    const thumbnailFileName = thumbnails[i];
    const timestamp = thumbnailFileName!.split("-")[1]!.split(".")[0];

    const thumbnailBuffer = fs.readFileSync(
      `${outputFilesPath}/${thumbnailFileName}`
    );

    const thumbnailKey = `thumbnails/${uploadId}/${thumbnailFileName}`;
    const fullThumbnailUrl = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_S3_REGION}.${env.AWS_S3_ENDPOINT}/${thumbnailKey}`;
    const thumbnailId = uuid();
    thumbnailsData.push({
      id: thumbnailId,
      timestamp: DateTime.fromSeconds(Number(timestamp)).toFormat("HHmmss"),
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

    fs.unlinkSync(`${outputFilesPath}/${thumbnailFileName}`);
  }
  fs.rmdirSync(outputFilesPath);
  

  log.debug("Saving thumbnails to db", [thumbnailsData]);

  await prisma.thumbnail.createMany({
    data: thumbnailsData,
    skipDuplicates: true,
  });
}

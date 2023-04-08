import log from "@/utils/logger";
import ffmpeg from "fluent-ffmpeg";
import { getObject, putObject, streamToBuffer } from "@/utils/s3";
import { prisma } from "@/server/db";
import { v4 as uuid } from "uuid";
import type { Prisma } from "@prisma/client";
import { env } from "@/env/server.mjs";
import os from "os";
import fs from "fs";
import { DateTime } from "luxon";
import { Readable } from "stream";

export default async function extractThumbnails({
  uploadId,
  fileName,
}: {
  uploadId: string;
  fileName: string;
}) {
  const baseDir = `${os.tmpdir()}/${uploadId}`;
  const inputFileName = `${os.tmpdir()}/${uploadId}/${fileName}`;
  const outputFilesPath = `${baseDir}/thumbnails`;

  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir);

  if (!fs.existsSync(outputFilesPath))
    fs.mkdirSync(outputFilesPath, { recursive: true });

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

  fs.writeFileSync(
    inputFileName,
    await streamToBuffer(video!.Body as Readable)
  );

  const outputFileName = `${outputFilesPath}/thumbnail-%01d.jpg`;
  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputFileName)
      .outputOptions("-movflags frag_keyframe+empty_moov")
      .outputOptions("-filter:v", "thumbnail,fps=1")
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
    const fullThumbnailUrl = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_S3_REGION}.amazonaws.com/${thumbnailKey}`;
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
  if (fs.existsSync(inputFileName)) fs.unlinkSync(inputFileName);

  log.debug("Saving thumbnails to db", [thumbnailsData]);

  await prisma.thumbnail.createMany({
    data: thumbnailsData,
    skipDuplicates: true,
  });
}

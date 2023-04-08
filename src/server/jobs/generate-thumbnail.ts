import { prisma } from "@/server/db";
import ffmpeg from "fluent-ffmpeg";
import { getObject, putObject, streamToBuffer } from "@/utils/s3";
import log from "@/utils/logger";
import { Readable } from "stream";
import { env } from "@/env/server.mjs";
import fs from "fs";
import os from "os";

export default async function generateThumbnail({
  uploadId,
  fileName,
}: {
  uploadId: string;
  fileName: string;
}) {
  log.info(`Generating thumbnail for upload ID: ${uploadId}...`);
  const baseDir = `${os.tmpdir()}/${uploadId}`;
  const inputFilePath = `${baseDir}/${fileName}`;
  const outputFilePath = `${baseDir}/thumbnail.png`;

  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir);

  const upload = await getObject({
    Bucket: env.AWS_S3_BUCKET,
    Key: `originals/${uploadId}/${fileName}`,
  });

  fs.writeFileSync(
    inputFilePath,
    await streamToBuffer(upload!.Body as Readable)
  );

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputFilePath)
      .outputOptions("-movflags frag_keyframe+empty_moov")
      .outputOptions("-ss", "00:00:01.000")
      .outputOptions("-vf", "scale=720:-2")
      .outputOptions("-vframes", "1")
      .outputOptions("-q:v", "2")
      .outputOptions("-c:v", "png")
      .save(outputFilePath)
      .on("start", (commandLine: string) => {
        log.info("Spawned FFmpeg with command: " + commandLine);
      })
      .on("error", (err: any) => {
        log.error(err);
        reject(err);
      })
      .on("end", () => {
        log.info("Finished processing");
        resolve();
      });
  });

  log.info(`Thumbnail generated for upload ID: ${uploadId}`);
  const thumbnail = fs.readFileSync(outputFilePath);
  const thumbnailKey = `thumbnails/${uploadId}.png`;

  await putObject({
    Bucket: env.AWS_S3_BUCKET,
    Key: thumbnailKey,
    Body: thumbnail,
    ContentType: "image/png",
    ContentLength: thumbnail.length,
  });

  const thumbnailUrl = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_S3_REGION}.amazonaws.com/${thumbnailKey}`;

  await prisma.video.update({
    where: {
      uploadId,
    },
    data: {
      thumbnailUrl,
    },
  });

  fs.unlinkSync(outputFilePath);
  fs.unlinkSync(inputFilePath);

  log.info(`Updated video with thumbnail URL: ${thumbnailUrl}`);
}

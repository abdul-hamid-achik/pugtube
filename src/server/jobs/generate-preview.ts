import { prisma } from "@/server/db";
import ffmpeg from "fluent-ffmpeg";
import { getObject, putObject, streamToBuffer } from "@/utils/s3";
import log from "@/utils/logger";
import { Readable } from "stream";
import { env } from "@/env/server.mjs";
import os from "os";
import fs from "fs";

export default async function generateThumbnail({
  uploadId,
  fileName,
}: {
  uploadId: string;
  fileName: string;
}) {
  try {
    const baseDir = `${os.tmpdir()}/${uploadId}`;
    const inputFileName = `${baseDir}/${fileName}`;
    const outputFileName = `${baseDir}/preview.gif`;

    if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir);

    log.info(`Generating Gif for upload ID: ${uploadId}...`);

    const upload = await getObject({
      Bucket: env.AWS_S3_BUCKET,
      Key: `originals/${uploadId}/${fileName}`,
    });

    fs.writeFileSync(
      inputFileName,
      await streamToBuffer(upload!.Body as Readable)
    );

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputFileName)
        .outputOptions("-movflags frag_keyframe+empty_moov")
        .outputOptions("-ss", "00:00:00")
        .outputOptions("-t", "3")
        .outputOptions("-vf", "fps=10,scale=720:-2:flags=lanczos")
        .outputOptions("-c:v", "gif")
        .save(outputFileName)
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

    log.info(`preview generated for upload ID: ${uploadId}`);

    const gif = await fs.readFileSync(outputFileName);

    const gifKey = `previews/${uploadId}.gif`;
    await putObject({
      Bucket: env.AWS_S3_BUCKET,
      Key: gifKey,
      Body: gif,
      ContentType: "image/gif",
      ContentLength: gif.length,
    });

    const previewUrl = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_S3_REGION}.amazonaws.com/${gifKey}`;

    await prisma.video.update({
      where: {
        uploadId,
      },
      data: {
        previewUrl,
      },
    });

    fs.unlinkSync(outputFileName);
    fs.unlinkSync(inputFileName);

    log.info(`Updated video with preview URL: ${previewUrl}`);
  } catch (err: any) {
    log.error(err);
  }
}

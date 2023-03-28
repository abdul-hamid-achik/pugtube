import { prisma } from "@/server/db";
import { createFFmpeg, streamToBuffer } from "@/utils/ffmpeg";
import { getObject, putObject } from "@/utils/s3";
import { log } from "next-axiom";
import { Readable } from "stream";

export default async function generateThumbnail({
  uploadId,
  fileName,
}: {
  uploadId: string;
  fileName: string;
}) {
  let ffmpeg;
  try {
    ffmpeg = await createFFmpeg();
    log.info(`Generating Gif for upload ID: ${uploadId}...`);
    const upload = await getObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `originals/${uploadId}/${fileName}`,
    });

    const inputFileName = fileName;

    const buffer = await streamToBuffer(upload!.Body as Readable);
    const gifOutputFileName = `${uploadId}.gif`;
    await ffmpeg.FS("writeFile", inputFileName, new Uint8Array(buffer));
    await ffmpeg.run(
      "-i",
      inputFileName,
      "-ss",
      "00:00:00",
      "-t",
      "3",
      "-vf",
      "fps=10,scale=w=min(720\\,iw):h=min(480\\,ih):flags=lanczos",
      "-c:v",
      "gif",
      `output/${gifOutputFileName}`
    );

    log.info(`preview generated for upload ID: ${uploadId}`);

    const gif = await ffmpeg.FS("readFile", gifOutputFileName);
    await putObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `preview/${uploadId}.gif`,
      Body: gif,
      ContentType: "image/gif",
      ContentLength: gif.length,
    });

    const thumbnailUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/preview/${uploadId}.gif`;

    await prisma.video.update({
      where: {
        uploadId,
      },
      data: {
        thumbnailUrl,
      },
    });

    await ffmpeg.FS("unlink", inputFileName);
    await ffmpeg.FS("unlink", gifOutputFileName);

    log.info(`Updated video with preview URL: ${thumbnailUrl}`);
  } catch (err: any) {
    ffmpeg?.exit();
    log.error(err);
  }
}

import { prisma } from "@/server/db";
import { createFFmpeg, streamToBuffer } from "@/utils/ffmpeg";
import { getObject, putObject } from "@/utils/s3";
import { log } from "@/utils/logger";
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
      "fps=10,scale=720:-2:flags=lanczos",
      "-c:v",
      "gif",
      `${gifOutputFileName}`
    );
    log.info(`preview generated for upload ID: ${uploadId}`);

    const gif = await ffmpeg.FS("readFile", gifOutputFileName);
    await putObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `previews/${uploadId}.gif`,
      Body: gif,
      ContentType: "image/gif",
      ContentLength: gif.length,
    });

    const previewUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/previews/${uploadId}.gif`;

    await prisma.video.update({
      where: {
        uploadId,
      },
      data: {
        previewUrl,
      },
    });

    await ffmpeg.FS("unlink", inputFileName);
    await ffmpeg.FS("unlink", gifOutputFileName);

    log.info(`Updated video with preview URL: ${previewUrl}`);
  } catch (err: any) {
    ffmpeg?.exit();
    log.error(err);
  }
}

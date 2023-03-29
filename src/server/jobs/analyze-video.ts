import { createFFmpeg, streamToBuffer } from "@/utils/ffmpeg";
import { log } from "@/utils/logger";
import { getObject, putObject } from "@/utils/s3";
import { PrismaClient } from "@prisma/client";
import mobilnet from "@tensorflow-models/mobilenet";
import tfnode from "@tensorflow/tfjs-node";
import { Readable } from "stream";

const prisma = new PrismaClient();

export default async function analzyeVideo({
  uploadId,
  fileName,
}: {
  uploadId: string;
  fileName: string;
}) {
  const ffmpeg = await createFFmpeg();
  const model = await mobilnet.load();
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
  log.info("found thumbnails", thumbnails);
  for (let i = 0; i < thumbnails.length; i++) {
    const thumbnailFileName = thumbnails[i];
    const timestamp = thumbnailFileName!.split("-")[1]!.split(".")[0];

    const thumbnailBuffer = await ffmpeg.FS(
      "readFile",
      `output/${thumbnailFileName}`
    );

    // Use fs module to read the thumbnail file as a buffer

    const tfimage = tfnode.node.decodeImage(thumbnailBuffer) as tfnode.Tensor3D;
    // @ts-ignore
    const predictions = await model.classify(tfimage);

    log.debug("found predictions", predictions);

    const thumbnailKey = `thumbnails/${thumbnailFileName}`;

    await prisma.thumbnail.create({
      data: {
        timestamp: Number(timestamp),
        url: thumbnailKey,
        video: {
          connect: {
            uploadId: uploadId,
          },
        },
      },
    });

    await putObject({
      Bucket: process.env.AWS_S3_BUCKET as string,
      Key: thumbnailKey,
      Body: thumbnailBuffer,
      ContentType: "image/jpeg",
      ContentLength: thumbnailBuffer.length,
    });

    ffmpeg.FS("unlink", `output/${thumbnailFileName}`);
    ffmpeg.FS("unlink", "output");
    ffmpeg.FS("unlink", fileName);
  }
  ffmpeg?.exit();
}

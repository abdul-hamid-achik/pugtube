import { env } from "@/env/server.mjs";
import { prisma } from "@/server/db";
import log from "@/utils/logger";
import { putObject } from "@/utils/s3";
import { Prisma } from "@prisma/client";
import { createClient, Video, Videos } from "pexels";
import { v4 as uuidv4 } from "uuid";

const client = createClient(env.PEXELS_API_KEY as string);

async function main() {
  const videoData: Prisma.VideoCreateManyInput[] = [];
  const uploadData: Prisma.UploadCreateManyInput[] = [];
  const metadataData: Prisma.VideoMetadataCreateManyInput[] = [];
  for (
    let page = process.env.SEED_PAGE
      ? parseInt(process.env.SEED_PAGE as string)
      : 1;
    page <= 10;
    page++
  ) {
    let per_page = process.env.SEED_PER_PAGE
      ? parseInt(process.env.SEED_PER_PAGE)
      : 5;

    const videos = (await client.videos.popular({ per_page, page })) as Videos;
    // @ts-ignore
    log.debug(`Fetched ${videos.videos?.length} videos from Pexels...`);

    // Iterate through each video
    let counter = 0;
    let videoId;
    for (const video of videos.videos) {
      try {
        videoId = video.id;
        log.debug(
          `Processing video ${counter + 1} of ${
            videos && videos.videos ? videos.videos.length : undefined
          }`
        );
        log.debug(`Video ID: ${video.id}...`);
        const { id, width, height, duration, video_files } = video;
        // Create a unique key for the video
        const uploadId = uuidv4();
        const metadataId = uuidv4();
        log.debug(
          `Video ID: ${id} has been assigned an upload ID: ${uploadId}...`
        );

        if (process.env.NODE_ENV === "production") {
          log.info(`https://pugtube.dev/upload/${uploadId}`);
        }

        // Download the highest resolution video file
        // @ts-ignore
        const videoFile: Video = video_files.sort(
          (a, b) => b.width! - a.width!
        )[0];
        const {
          file_type,
          width: videoWidth,
          height: videoHeight,
          link,
        } = videoFile as Video & { link: string; file_type: string };
        log.debug(`Video ID: ${id} has been downloaded...`);

        // Fetch the video and store it in a buffer
        const response = await fetch(link);
        const videoArrayBuffer = await response.arrayBuffer();
        const videoBuffer = Buffer.from(videoArrayBuffer);

        log.debug(`Video ID: ${id} has been buffered...`);

        // upload it to S3
        const fileName = `${id}_${videoWidth}x${videoHeight}.${
          file_type.split("/")[1]
        }`;
        await putObject({
          Bucket: env.AWS_S3_BUCKET,
          Key: `originals/${uploadId}/${fileName}`,
          Body: videoBuffer,
        });

        log.debug(`Video ID: ${id} has been uploaded to S3...`);

        uploadData.push({
          size: videoBuffer.length,
          offset: 0,
          creationDate: new Date(),
          transcoded: false,
          id: uploadId,
          metadataId: metadataId,
        });

        log.debug(`Video ID: ${id} has been added to the database...`);

        // Create video metadata entry in the database
        metadataData.push({
          name: fileName,
          type: file_type,
          fileType: file_type,
          fileName: fileName,
          relativePath: uploadId,
          uploadId: uploadId,
          id: metadataId,
        });

        log.debug(`Video Metadata: ${id} has been added to the database...`);

        videoData.push({
          title: fileName,
          description: "Uploaded from Pexels",
          duration: duration,
          uploadId: uploadId,
          userId:
            process.env.NODE_ENV === "production"
              ? `user_2N5clkHn2NZ5L2VkTd17F9kWU0w`
              : (`user_2MUdNAWDRBjKG78KlxxnIwgWo6i` as string), // TODO: Replace with a random user
        });

        counter++;
      } catch (error: any) {
        counter++;
        log.error(`Error while processing video: ${videoId}`, error);
      }
    }
  }

  await prisma.videoMetadata.createMany({
    data: metadataData,
  });

  await prisma.upload.createMany({
    data: uploadData,
  });

  await prisma.video.createMany({
    data: videoData,
  });

  log.info(`created uploads and videos complete!`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit();
  })
  .catch(async (e) => {
    log.error("Error seeding: ", e);
    await prisma.$disconnect();
    process.exit(1);
  });

export {};

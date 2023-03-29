import { env } from "@/env/server.mjs";
import { prisma } from "@/server/db";
import * as jobs from "@/server/jobs";
import { putObject } from "@/utils/s3";
import axios from "axios";
import { log } from "@/utils/logger";
import { createClient, Video, Videos } from "pexels";
import { v4 as uuidv4 } from "uuid";

const client = createClient(env.PEXELS_API_KEY as string);

process.on("uncaughtException", (err) => {
  log.error("Uncaught exception:", err);
});

async function main() {
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
        log.debug(
          `Video ID: ${id} has been assigned an upload ID: ${uploadId}...`
        );

        if (env.NODE_ENV === "production") {
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
        const response = await axios.get(link, { responseType: "arraybuffer" });
        const videoBuffer = Buffer.from(response.data);

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

        // Create an upload entry in the database
        await prisma.upload.create({
          data: {
            size: videoBuffer.length,
            offset: 0,
            creationDate: new Date(),
            transcoded: false,
            id: uploadId,
          },
        });

        log.debug(`Video ID: ${id} has been added to the database...`);

        // Create video metadata entry in the database
        await prisma.videoMetadata.create({
          data: {
            name: fileName,
            type: file_type,
            fileType: file_type,
            fileName: fileName,
            relativePath: uploadId,
            uploadId: uploadId,
          },
        });

        log.debug(`Video Metadata: ${id} has been added to the database...`);

        log.debug(`Video ID: ${id} has been added to the queue...`);

        await prisma.video.create({
          data: {
            title: fileName,
            description: "Uploaded from Pexels",
            duration: duration,
            uploadId: uploadId,
            userId:
              env.NODE_ENV === "production"
                ? `user_2N5clkHn2NZ5L2VkTd17F9kWU0w`
                : (`user_2MUdNAWDRBjKG78KlxxnIwgWo6i` as string), // TODO: Replace with a random user
          },
        });

        await jobs.transcodeVideo({ uploadId, fileName });
        await jobs.generateThumbnail({ uploadId, fileName });
        await jobs.generatePreview({ uploadId, fileName });

        counter++;
      } catch (error: any) {
        counter++;
        log.error(`Error while processing video: ${videoId}`, error);
      }
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

export {};

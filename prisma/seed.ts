import { prisma } from "@/server/db";
import queue from '@/server/queue';
import { putObject } from '@/utils/s3';
import axios from 'axios';
import { log } from 'next-axiom';
import { createClient } from 'pexels';
import { v4 as uuidv4 } from 'uuid';
import { env } from '@/env/server.mjs';

const client = createClient(env.PEXELS_API_KEY as string);

async function main() {
  try {
    // Fetch popular videos from Pexels
    const videos = await client.videos.popular({ per_page: 1 });
    // @ts-ignore
    log.debug(`Fetched ${videos.total_results} videos from Pexels...`)
    // Iterate through each video
    // @ts-ignore
    for (const video of videos.videos) {
      log.debug(`Processing video ID: ${video.id}...`)
      const { id, width, height, duration, video_files } = video;
      // Create a unique key for the video
      const uploadId = uuidv4();

      // Download the highest resolution video file
      // @ts-ignore
      const videoFile = video_files.sort((a, b) => b.width - a.width)[0];
      const { file_type, width: videoWidth, height: videoHeight, link } = videoFile;
      log.debug(`Video ID: ${id} has been downloaded...`)

      // Fetch the video and store it in a buffer
      const response = await axios.get(link, { responseType: 'arraybuffer' });
      const videoBuffer = Buffer.from(response.data);

      log.debug(`Video ID: ${id} has been buffered...`)

      // upload it to S3
      const fileName = `${id}_${videoWidth}x${videoHeight}.${file_type.split('/')[1]}`;
      await putObject({
        Bucket: env.AWS_S3_BUCKET,
        Key: uploadId,
        Body: videoBuffer,
      });

      log.debug(`Video ID: ${id} has been uploaded to S3...`)

      // Create an upload entry in the database
      await prisma.upload.create({
        data: {
          size: videoBuffer.length,
          offset: 0,
          creation_date: new Date(),
          transcoded: false,
          id: uploadId,
        },
      });

      log.debug(`Video ID: ${id} has been added to the database...`)

      // Create video metadata entry in the database
      await prisma.videoMetadata.create({
        data: {
          name: fileName,
          type: file_type,
          filetype: file_type,
          filename: fileName,
          relativePath: uploadId,
          uploadId: uploadId,
        },
      });

      log.debug(`Video Metadata: ${id} has been added to the database...`)

      // Add a job to the queue for video transcoding
      queue.add("hls", { data: { uploadId, fileName } });
      log.debug(`Video ID: ${id} has been added to the queue...`)

      await prisma.video.create({
        data: {
          title: fileName,
          description: video.description,
          duration: duration,
          uploadId: uploadId,
          userId: `user_2N5clkHn2NZ5L2VkTd17F9kWU0w` as string, // TODO: Replace with a random user
        },
      })
    }
  } catch (error: any) {
    log.error("Error seeding videos:", error);
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

export { };

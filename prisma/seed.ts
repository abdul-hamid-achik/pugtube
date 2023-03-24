import { env } from '@/env/server.mjs';
import { prisma } from "@/server/db";
import * as functions from '@/server/functions';
import { putObject } from '@/utils/s3';
import axios from 'axios';
import { log as logger } from 'next-axiom';
import { createClient } from 'pexels';
import { v4 as uuidv4 } from 'uuid';

const client = createClient(env.PEXELS_API_KEY as string);

const log = env.NODE_ENV === 'production' ? logger : console;

process.setMaxListeners(20);

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});


async function main() {
  // Fetch popular videos from Pexels
  for (let page = 1; page <= 10; page++) {
    let per_page = process.env.SEED_PER_PAGE ? parseInt(process.env.SEED_PER_PAGE) : 50

    const videos = await client.videos.popular({ per_page, page });
    // @ts-ignore
    log.debug(`Fetched ${videos.videos?.length} videos from Pexels...`)

    // Iterate through each video
    let counter = 0;
    let videoId;
    // @ts-ignore
    for (const video of videos.videos) {
      try {
        videoId = video.id;
        // @ts-ignore
        log.debug(`Processing video ${counter + 1} of ${videos?.videos?.length}`)
        log.debug(`Video ID: ${video.id}...`)
        const { id, width, height, duration, video_files } = video;
        // Create a unique key for the video
        const uploadId = uuidv4();
        log.debug(`Video ID: ${id} has been assigned an upload ID: ${uploadId}...`)

        if (env.NODE_ENV === 'production') {
          log.info(`Watch Upload Status: https://pugtube.dev/upload/${uploadId}/status`)
        }

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

        await new Promise(resolve => setTimeout(resolve, 1000));
        log.debug(`Video ID: ${id} has been uploaded to S3...`)

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

        log.debug(`Video ID: ${id} has been added to the database...`)

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

        log.debug(`Video Metadata: ${id} has been added to the database...`)

        // Add a job to the queue for video transcoding

        log.debug(`Video ID: ${id} has been added to the queue...`)

        await prisma.video.create({
          data: {
            title: fileName,
            description: video.description || 'Uploaded from Pexels',
            duration: duration,
            uploadId: uploadId,
            userId: env.NODE_ENV === 'production' ? `user_2N5clkHn2NZ5L2VkTd17F9kWU0w` : `user_2MUdNAWDRBjKG78KlxxnIwgWo6i` as string, // TODO: Replace with a random user
          },
        })

        await functions.moveUpload({ uploadId, fileName });

        await Promise.all([
          functions.transcodeVideo({ uploadId, fileName }),
          functions.generateThumbnail({ uploadId, fileName })
        ]);

        await new Promise(resolve => setTimeout(resolve, 500));
        counter++;
      } catch (error: any) {
        counter++;
        log.error(`Error while processing video: ${videoId}`, error)
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

export { };

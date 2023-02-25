import { inngest } from '@/server/background';
import { prisma } from '@/server/db';
import { downloadObject, putObject } from '@/utils/s3';
import { createFFmpeg } from '@ffmpeg/ffmpeg';
import { log as logger } from 'next-axiom';
import os from 'os';

const log = logger.with({ function: 'Generate video thumbnail' });

const ffmpeg = createFFmpeg({
    log: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',
});

export default inngest.createFunction(
    'Generate video thumbnail',
    'pugtube/hls.thumbnail',
    async ({ event }) => {
        const { uploadId } = event.data as { uploadId: string };
        await ffmpeg.load();
        const video = await prisma.video.findFirst({
            where: {
                uploadId,
            },
        });

        if (!video) {
            throw new Error(`Video not found for upload ID: ${uploadId}`);
        }

        log.info(`Generating thumbnail for upload ID: ${uploadId}...`);

        const inputFilePath = await downloadObject(uploadId);
        const outputFilePath = `${os.tmpdir()}/output/${uploadId}.png`;

        await ffmpeg.run(
            '-i', inputFilePath,
            '-ss', '00:00:01.000',
            '-vframes', '1',
            outputFilePath,
        );

        log.info(`Thumbnail generated for upload ID: ${uploadId}`);

        const thumbnail = await ffmpeg.FS('readFile', outputFilePath);

        await putObject({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `thumbnails/${uploadId}.png`,
            Body: thumbnail,
            ContentType: 'image/png',
        });

        const thumbnailUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/thumbnails/${uploadId}.png`;

        await prisma.video.update({
            where: {
                id: video.id
            },
            data: {
                thumbnailUrl
            }
        });

        log.info(`Updated video with thumbnail URL: ${thumbnailUrl}`);
        await inngest.send('pugtube/hls.thumbnailed', { data: { uploadId } });
    }
);

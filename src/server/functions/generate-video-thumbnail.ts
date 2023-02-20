import { inngest } from '@/server/background';
import { S3 } from '@aws-sdk/client-s3';
import { createFFmpeg } from '@ffmpeg/ffmpeg';
import { log as logger } from 'next-axiom';
import os from 'os';
const log = logger.with({ function: 'Transcode to HLS' });
const s3 = new S3({
    region: process.env.AWS_REGION,
});

const ffmpeg = createFFmpeg({
    log: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',
});

export default inngest.createFunction(
    'Generate video thumbnail',
    'pugtube/hls.thumbnail',
    async ({ event }) => {
        const { uploadId } = event.data as { uploadId: string };
        await ffmpeg.load();

        log.info(`Generating thumbnail for upload ID: ${uploadId}...`)

        const inputFilePath = `${os.tmpdir()}/input/${uploadId}`;
        const outputFilePath = `${os.tmpdir()}/output/${uploadId}.png`;

        await ffmpeg.run(
            '-i', inputFilePath,
            '-ss', '00:00:01.000',
            '-vframes', '1',
            outputFilePath,
        );

        log.info(`Thumbnail generated for upload ID: ${uploadId}`);

        const thumbnail = await ffmpeg.FS('readFile', outputFilePath);

        await s3.putObject({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `thumbnails/${uploadId}.png`,
            Body: thumbnail,
            ContentType: 'image/png',
        });

        await inngest.send('pugtube/hls.thumbnail.generated', { data: { uploadId } });
    })
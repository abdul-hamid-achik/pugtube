import { inngest } from '@/server/background';
import { S3 } from '@aws-sdk/client-s3';
import fs from 'fs';
import { log as logger } from 'next-axiom';
import os from 'os';

const log = logger.with({ function: 'Upload to S3' });

const s3 = new S3({
    region: process.env.AWS_REGION,
});

export default inngest.createFunction("Upload artifacts to s3", 'hls.upload', async ({ event }) => {
    log.info('Uploading artifacts to S3...')
    const { uploadId } = event.data as { uploadId: string };

    log.info(`Uploading transcoded video for upload ID: ${uploadId}...`)
    const outputDirPath = `${os.tmpdir()}/output`;
    const transcodedVideoKey = `transcoded/${uploadId}/output.m3u8`;
    const transcodedVideo = fs.readFileSync(`${outputDirPath}/playlist.m3u8`);

    log.info(`Uploading transcoded video to S3 for upload ID: ${uploadId}...`)
    // Upload the transcoded video to S3
    await s3.putObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: transcodedVideoKey,
        Body: transcodedVideo,
    });

    // Log success message
    log.info(`Transcoded video uploaded to S3 for upload ID: ${uploadId}`);
    await inngest.send('hls.uploaded', { data: { uploadId } });
});
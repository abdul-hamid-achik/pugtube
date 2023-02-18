import { inngest } from '@/server/background';
import { S3 } from '@aws-sdk/client-s3';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import fs from 'fs';
import { log as logger } from 'next-axiom';
import os from 'os';
import { Readable } from 'stream';
const log = logger.with({ function: 'Transcode to HLS' });
const s3 = new S3({
    region: process.env.AWS_REGION,
});

const ffmpeg = createFFmpeg({
    log: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',
});

export default inngest.createFunction('Transcode to HLS', 'hls.transcode', async ({ event }) => {
    log.info('Transcoding video...')
    const { uploadId } = event.data as { uploadId: string };
    // Create temporary directories to store input and output files
    const inputDirPath = `${os.tmpdir()}/input`;
    const outputDirPath = `${os.tmpdir()}/output`;

    log.info(`Transcoding video for upload ID: ${uploadId}...`)

    if (!fs.existsSync(inputDirPath)) {
        fs.mkdirSync(inputDirPath);
    }

    if (!fs.existsSync(outputDirPath)) {
        fs.mkdirSync(outputDirPath);
    }

    // Download TUS upload file from S3
    const upload = await s3.getObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: uploadId,
    });

    log.info(`uploaded file: ${upload?.Metadata?.originalname}`)

    const inputFilePath = `${inputDirPath}/${upload?.Metadata?.originalname}`
    const inputStream = upload?.Body as Readable

    const writeStream = fs.createWriteStream(inputFilePath)

    await new Promise((resolve, reject) => {
        inputStream.pipe(writeStream);
        inputStream.on('error', reject);
        writeStream.on('error', reject);
        writeStream.on('finish', resolve);
    });

    log.info(`uploaded file: ${inputFilePath}`)

    // Load input file into FFmpeg
    await ffmpeg.load();
    log.info(`loaded ffmpeg`)
    await ffmpeg.FS('writeFile', inputFilePath, await fetchFile(inputFilePath))
    log.info(`wrote file to ffmpeg`)

    // Transcode the video to HLS format
    await ffmpeg.run(
        '-i', inputFilePath,
        '-codec', 'copy',
        '-start_number', '0',
        '-hls_time', '10',
        '-hls_list_size', '0',
        '-f', 'hls', `${outputDirPath}/playlist.m3u8`, `${outputDirPath}/segment-%03d.ts`,
    )

    log.info(`transcoded file: ${outputDirPath}/playlist.m3u8`)
    const transcodedVideo = fs.readFileSync(`${outputDirPath}/playlist.m3u8`)
    const transcodedVideoKey = `transcoded/${uploadId}/output.m3u8`;

    log.info(`Uploading transcoded video to S3 for upload ID: ${uploadId}...`)

    await s3.putObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: transcodedVideoKey,
        Body: transcodedVideo,
    })

    log.info(`Transcoded video uploaded to S3 for upload ID: ${uploadId}`)
    await inngest.send('hls.transcoded', { data: { uploadId } })
});

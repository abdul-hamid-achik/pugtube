import { inngest } from '@/server/background';
import { prisma } from '@/server/db';
import { getObject, putObject } from '@/utils/s3';
import { S3 } from '@aws-sdk/client-s3';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { Upload, VideoMetadata } from '@prisma/client';
import fs from 'fs';
import { log as logger } from 'next-axiom';
import os from 'os';
import { Readable } from 'stream';

const log = logger.with({ function: 'Transcode video to HLS' });

const s3 = new S3({
    region: process.env.AWS_REGION,
});

const ffmpeg = createFFmpeg({
    log: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',
});

export default inngest.createFunction('Transcode video', 'pugtube/hls.transcode', async ({ event }) => {
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
    const upload = await getObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: uploadId,
    });

    const parsedUpload = JSON.parse(upload?.Metadata?.file || '{}') as Upload
    const parsedUploadMetadata: VideoMetadata = (parsedUpload as any)?.metadata || {}
    const inputFileName = parsedUploadMetadata.name
    const inputFilePath = `${inputDirPath}/${inputFileName}`
    const inputStream = upload?.Body as Readable        // Derive the output file name
    const outputFileName = `${parsedUpload.id}.m3u8`;
    const writeStream = fs.createWriteStream(inputFilePath)

    await new Promise((resolve, reject) => {
        inputStream.pipe(writeStream);
        inputStream.on('error', reject);
        writeStream.on('error', reject);
        writeStream.on('finish', resolve);
    });

    log.info(`uploaded file: ${inputFilePath}`)

    // Load input file into FFmpeg
    if (!ffmpeg.isLoaded()) await ffmpeg.load();
    log.info(`loaded ffmpeg`)
    await ffmpeg.FS('writeFile', inputFileName, await fetchFile(inputFilePath))
    log.info(`wrote file to ffmpeg`)
    ffmpeg.FS('mkdir', 'output');
    log.info(`created output directory`)

    // Transcode the video to HLS format
    await ffmpeg.run(
        '-i', inputFileName,
        '-codec', 'copy',
        '-start_number', '0',
        '-hls_time', '2',
        '-hls_flags', 'independent_segments',
        '-hls_segment_type', 'mpegts',
        '-hls_segment_filename', `output/segment-%01d.ts`,
        '-hls_playlist_type', 'vod',
        '-hls_list_size', '0',
        '-f', 'hls', `output/${outputFileName}`,
    );

    log.info(`ran ffmpeg`)

    // Upload the transcoded video to S3
    const transcodedVideo = ffmpeg.FS('readFile', `output/${outputFileName}`);
    const transcodedVideoKey = `transcoded/${uploadId}/output.m3u8`;

    // Upload the transcoded video playlist to S3
    await putObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: transcodedVideoKey,
        Body: transcodedVideo,
    });

    const video = await prisma.video.findFirst({
        where: {
            originalUploadId: {
                equals: uploadId,
            },
        }
    });

    if (!video) {
        throw new Error(`Could not find video for upload ID ${uploadId}`);
    }

    log.debug(`Found video with ID ${video.id} for upload ID ${uploadId}`, { video })

    // Save the HLS playlist to the database
    const playlist = await prisma.hlsPlaylist.create({
        data: {
            video: {
                connect: {
                    id: video.id,
                },
            },
            resolution: '1080p',
            key: transcodedVideoKey,
            url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${transcodedVideoKey}`,
        },
    });

    log.info(`Saved playlist with ID ${playlist.id} for video ${video.id}`);

    try {
        const segmentFiles = ffmpeg.FS('readdir', 'output').filter((filename) => {
            return /^segment-\d+\.ts$/.test(filename);
        });

        const segmentCount = segmentFiles.length;

        for (let i = 0; i < segmentCount; i++) {
            const segmentPath = `output/segment-${i}.ts`;
            const segment = ffmpeg.FS('readFile', segmentPath);
            const segmentKey = `transcoded/${uploadId}/segment-${i}.ts`;

            await prisma.hlsSegment.create({
                data: {
                    playlist: {
                        connect: {
                            id: playlist.id,
                        },
                    },
                    video: {
                        connect: {
                            id: video.id,
                        }
                    },
                    url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${segmentKey}`,
                    segmentNumber: i,
                    resolution: '1080p',
                    key: segmentKey,
                    duration: 2.000
                },
            });

            await putObject({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: segmentKey,
                Body: segment,
            });


            log.info(`Transcoded segment uploaded to S3 for upload ID: ${uploadId} - segment ${i}`);
        }
        // Log success message
        log.info(`Transcoded video uploaded to S3 for upload ID: ${uploadId}`);
        await inngest.send('pugtube/hls.transcoded', { data: { uploadId } })
    } catch (error) {
        log.error(`Error transcoding video for upload ID: ${uploadId}`, { error });
        throw error;
    }
});

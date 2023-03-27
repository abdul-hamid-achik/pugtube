import { prisma } from '@/server/db';
import { createFFmpeg, streamToBuffer } from "@/utils/ffmpeg";
import { getObject, putObject } from '@/utils/s3';
import fs from 'fs';
import { log } from 'next-axiom';
import os from 'os';
import { Readable } from 'stream';

export default async function generateThumbnail({ uploadId, fileName }: { uploadId: string, fileName: string }) {
    let ffmpeg
    try {
        ffmpeg = await createFFmpeg();
        log.info(`Generating thumbnail for upload ID: ${uploadId}...`);

        log.info(`Transcoding video for upload ID: ${uploadId}...`)


        const upload = await getObject({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `originals/${uploadId}/${fileName}`,
        });

        const inputFileName = fileName

        const buffer = await streamToBuffer(upload!.Body as Readable);
        const outputFileName = `${uploadId}.png`;
        await ffmpeg.FS('writeFile', inputFileName, new Uint8Array(buffer));
        await ffmpeg.run(
            '-i', inputFileName,
            '-ss', '00:00:01.000',
            '-vf', 'scale=480:360',
            '-vframes', '1',
            '-q:v', '2',
            '-c:v', 'png',
            '-movflags', '+faststart',
            outputFileName,
        );


        log.info(`Thumbnail generated for upload ID: ${uploadId}`);

        const thumbnail = await ffmpeg.FS('readFile', outputFileName);
        await putObject({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `thumbnails/${uploadId}.png`,
            Body: thumbnail,
            ContentType: 'image/png',
            ContentLength: thumbnail.length,
        });

        const thumbnailUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/thumbnails/${uploadId}.png`;

        await prisma.video.update({
            where: {
                uploadId
            },
            data: {
                thumbnailUrl
            }
        });

        await ffmpeg.FS('unlink', inputFileName);
        await ffmpeg.FS('unlink', outputFileName);

        log.info(`Updated video with thumbnail URL: ${thumbnailUrl}`);
    } catch (err: any) {
        ffmpeg?.exit();
        log.error(err);
    }
};

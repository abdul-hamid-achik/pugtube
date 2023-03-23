import { prisma } from '@/server/db';
import { createFFmpeg, fetchFile } from '@/utils/ffmpeg';
import { getObject, putObject } from '@/utils/s3';
import fs from 'fs';
import { log } from 'next-axiom';
import os from 'os';
import { Readable } from 'stream';

export default async function generateThumbnail({ uploadId, fileName }: { uploadId: string, fileName: string }) {
    const ffmpeg = await createFFmpeg();
    log.info(`Generating thumbnail for upload ID: ${uploadId}...`);
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

    const upload = await getObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: uploadId,
    });

    if (!upload?.Body) {
        throw new Error('No upload body');
    }


    const inputFileName = fileName
    const inputFilePath = `${inputDirPath}/${inputFileName}`
    const inputStream = upload?.Body as Readable        // Derive the output file name
    const writeStream = fs.createWriteStream(inputFilePath)

    await new Promise((resolve, reject) => {
        inputStream.pipe(writeStream);
        inputStream.on('error', reject);
        writeStream.on('error', reject);
        writeStream.on('finish', resolve);
    });

    const outputFilePath = `${os.tmpdir()}/${uploadId}.png`;
    const outputFileName = `${uploadId}.png`;
    await ffmpeg.FS('writeFile', inputFileName, await fetchFile(inputFilePath))
    await ffmpeg.run(
        '-i', inputFileName,
        '-ss', '00:00:01.000',
        '-vf', 'scale=480:360',
        '-vframes', '1',
        '-q:v', '2',
        '-c:v', 'libx264',
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

    log.info(`Updated video with thumbnail URL: ${thumbnailUrl}`);
}
;

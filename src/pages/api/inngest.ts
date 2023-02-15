/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */
import { inngest } from '../../server/background'
import { serve } from "inngest/next"
import { prisma } from "../../server/db"
import { S3 } from 'aws-sdk';
import { createFFmpeg, fetchFile, FS } from '@ffmpeg/ffmpeg'
import fs from 'fs'

const s3 = new S3({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const transcode = inngest.createFunction("Transcode to HLS", "hls.transcode", async ({ event }) => {
    const { uploadId } = event.data as { uploadId: string };
    const upload = await prisma.upload.findUnique({
        where: {
            id: uploadId
        }
    });

    if (!upload) {
        throw new Error("Upload not found");
    }

    // Load FFmpeg
    const ffmpeg = createFFmpeg({ log: process.env.NODE_ENV === "development" });
    await ffmpeg.load();

    // Download the file from S3 and write it to the virtual file system
    const inputFilePath = `/tmp/${upload.id}`;
    await s3.getObject({ Bucket: process.env.AWS_S3_BUCKET as string, Key: upload.id })
        .createReadStream()
        .pipe(fs.createWriteStream(inputFilePath))

    ffmpeg.FS('writeFile', inputFilePath, await fetchFile(`file://${inputFilePath}`));

    // Transcode the video to HLS format
    await ffmpeg.run('-i', inputFilePath, '-codec', 'copy', '-start_number', '0', '-hls_time', '10', '-hls_list_size', '0', '-f', 'hls', '/tmp/output.m3u8');

    // Get the transcoded files from the virtual file system and upload them to S3
    const outputDirPath = '/tmp/output';
    FS.mkdir(outputDirPath);
    const hlsOutput = ffmpeg.FS('readdir', outputDirPath);
    for (const outputFileName of hlsOutput) {
        const outputFilePath = `${outputDirPath}/${outputFileName}`;
        const outputData = ffmpeg.FS('readFile', outputFilePath);
        const key = `${upload.id}/${outputFileName}`;
        await s3.putObject({ Bucket: process.env.AWS_S3_BUCKET as string, Key: key, Body: outputData }).promise();
    }



    console.log("Transcoding video", uploadId);
});



export default serve("pugtube", [transcode])
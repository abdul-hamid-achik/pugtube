/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { inngest } from '@/server/background';
import { prisma } from '@/server/db';
import { S3 } from '@aws-sdk/client-s3';
import { createFFmpeg, fetchFile, FS } from '@ffmpeg/ffmpeg';
import fs from 'fs';
import { serve } from 'inngest/next';
import { Readable } from 'stream';

const s3 = new S3({
  region: process.env.AWS_REGION,
});

const transcode = inngest.createFunction('Transcode to HLS', 'hls.transcode', async ({ event }) => {
  const { uploadId } = event.data as { uploadId: string };
  const upload = await prisma.upload.findUnique({
    where: {
      id: uploadId,
    },
  });

  if (!upload) {
    throw new Error('Upload not found');
  }

  // Load FFmpeg
  const ffmpeg = createFFmpeg({ log: process.env.NODE_ENV === 'development' });
  await ffmpeg.load();

  // Download the file from S3 and write it to the virtual file system
  const inputFilePath = `/tmp/${upload.id}`;
  const s3Object = await s3.getObject({
    Bucket: process.env.AWS_S3_BUCKET as string, Key: upload.id,
  });
  const readStream = s3Object.Body as Readable;
  readStream.pipe(fs.createWriteStream(inputFilePath));

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
    await s3.putObject({ Bucket: process.env.AWS_S3_BUCKET as string, Key: key, Body: outputData });
  }

  console.log('Transcoding video', uploadId);
});

export default serve('pugtube', [transcode]);

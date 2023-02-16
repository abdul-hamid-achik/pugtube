import { inngest } from '@/server/background';
import { prisma } from '@/server/db';
import { S3 } from '@aws-sdk/client-s3';
import { createFFmpeg } from '@ffmpeg/ffmpeg';
import fs from 'fs';
import { serve } from 'inngest/next';
import os from 'os';
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
    include: {
      metadata: true,
    },
  });

  if (!upload) {
    throw new Error('Upload not found');
  }

  const inputDirPath = `${os.tmpdir()}/input`;
  const outputDirPath = `${os.tmpdir()}/output`;


  if (!fs.existsSync(inputDirPath)) {
    fs.mkdirSync(inputDirPath);
  }

  if (!fs.existsSync(outputDirPath)) {
    fs.mkdirSync(outputDirPath);
  }

  const inputFilePath = `${inputDirPath}/${upload?.metadata?.filename}`;

  // Load FFmpeg
  const ffmpeg = createFFmpeg({
    log: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
  });

  await ffmpeg.load();

  const s3Object = await s3.getObject({
    Bucket: process.env.AWS_S3_BUCKET as string,
    Key: upload.id,
  });

  const readStream = s3Object.Body as Readable;
  readStream.pipe(fs.createWriteStream(inputFilePath));

  // ffmpeg.FS('writeFile', inputFilePath, await fetchFile(inputFilePath));

  console.log('Creating output directory', outputDirPath);

  // Transcode the video to HLS format
  await ffmpeg.run(
    '-i', inputFilePath,
    '-codec', 'copy',
    '-start_number', '0',
    '-hls_time', '10',
    '-hls_list_size', '0',
    '-f', 'hls', `${outputDirPath}/playlist.m3u8`, `${outputDirPath}/segment-%03d.ts`,
  );

  console.log('Transcoding video', uploadId);
});

export default serve('pugtube', [transcode]);

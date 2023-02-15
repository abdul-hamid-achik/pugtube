/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */
import { inngest } from '../../server/background'
import { serve } from "inngest/next"
import { prisma } from "../../server/db"
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg'
import type { Upload } from '@prisma/client';

const transcode = inngest.createFunction("Transcode to HLS", "hls.transcode", async ({ event }) => {
    const { uploadId } = event.data as { uploadId: string };
    // @ts-ignore
    const upload = await prisma.upload.findUnique({
        where: {
            id: uploadId
        }
    }) as Upload | null;

    if (!upload) {
        throw new Error("Upload not found")
    }

    // Load FFmpeg
    const ffmpeg = createFFmpeg({ log: process.env.NODE_ENV === "development" });
    await ffmpeg.load();

    // Download the file from S3 and write it to the virtual file system
    ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(`https://pugtube-dev.s3.amazonaws.com/${upload.id}`));

    // Transcode the video to HLS format
    await ffmpeg.run('-i', 'input.mp4', '-codec', 'copy', '-start_number', '0', '-hls_time', '10', '-hls_list_size', '0', '-f', 'hls', 'output.m3u8');

    // Get the transcoded file from the virtual file system and save it to S3
    const hlsOutput = ffmpeg.FS('readFile', 'output.m3u8');
    // TODO: Save the HLS output to S3
    console.log(hlsOutput)

    console.log("Transcoding video", uploadId);
});


export default serve("pugtube", [transcode])
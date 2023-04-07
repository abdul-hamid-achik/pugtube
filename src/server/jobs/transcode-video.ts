import { prisma } from "@/server/db";
import ffmpeg from "fluent-ffmpeg";
import { getObject, putObject, streamToBuffer } from "@/utils/s3";
import log from "@/utils/logger";
import os from "os";
import { ParsedSegment, Parser } from "m3u8-parser";
import { Readable } from "stream";
import { Prisma } from "@prisma/client";
import { env } from "@/env/server.mjs";
import fs from "fs";

export default async function transcodeVideo({
  uploadId,
  fileName,
}: {
  uploadId: string;
  fileName: string;
}) {
  log.info(`Transcoding video for upload ID: ${uploadId}...`);

  const baseDir = `${os.tmpdir()}/${uploadId}`;
  const outputFileName = "playlist.m3u8";
  const outputFilePath = `${baseDir}/${outputFileName}`;
  const inputFileName = `${baseDir}/${fileName}`;

  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir);
  }

  const upload = await getObject({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `originals/${uploadId}/${fileName}`,
  });

  fs.writeFileSync(
    inputFileName,
    await streamToBuffer(upload!.Body as Readable)
  );

  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputFileName)
      .videoCodec("libx264")
      .outputOptions("-movflags frag_keyframe+empty_moov")
      .outputOptions("-preset", "fast")
      .outputOptions("-profile:v", "main")
      .outputOptions("-start_number", "0")
      .outputOptions("-vf", "scale=720:-2")
      .outputOptions("-level:v", "3.1")
      .outputOptions("-hls_time", "3")
      .outputOptions("-hls_flags", "independent_segments")
      .outputOptions("-hls_segment_type", "mpegts")
      .outputOptions("-hls_segment_filename", `${baseDir}/segment-%01d.ts`)
      .outputOptions("-hls_playlist_type", "vod")
      .outputOptions("-hls_list_size", "0")
      .outputOptions("-b:v", "800k")
      .outputOptions("-maxrate", "1000k")
      .outputOptions("-bufsize", "1200k")
      .outputOptions("-g", "12")
      .outputOptions("-keyint_min", "72")
      .outputFormat("hls")
      .on("start", (commandLine: string) => {
        log.info("Spawned FFmpeg with command: " + commandLine);
      })
      .on(
        "progress",
        (progress: {
          frames: number;
          currentFps: number;
          currentKbps: number | undefined;
          targetSize: number | undefined;
          timemark: string;
        }) => {
          log.info("Processing: " + progress.timemark);
        }
      )
      .on("end", () => {
        log.info("Transcoding succeeded");
        resolve();
      })
      .on("error", (err: any) => {
        log.error("Transcoding failed: " + err.message);
        reject(err);
      })
      .save(outputFilePath);
  });

  const transcodedVideo = fs.readFileSync(outputFilePath);
  const transcodedVideoKey = `transcoded/${uploadId}/playlist.m3u8`;
  const decoder = new TextDecoder();
  const transcodedVideoString = decoder.decode(transcodedVideo);

  const playlistParser = new Parser();
  playlistParser.push(transcodedVideoString);
  playlistParser.end();
  const parsedPlaylist = playlistParser.manifest;

  log.info(`parsed playlist`, { parsedPlaylist });

  await putObject({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: transcodedVideoKey,
    Body: transcodedVideo,
  });

  const video = await prisma.video.findUniqueOrThrow({
    where: {
      uploadId: uploadId,
    },
  });

  const playlistData = {
    key: transcodedVideoKey,
    url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${transcodedVideoKey}`,
    allowCache: parsedPlaylist.allowCache,
    discontinuitySequence: parsedPlaylist.discontinuitySequence,
    endList: parsedPlaylist.endList,
    mediaSequence: parsedPlaylist.mediaSequence,
    playlistType: parsedPlaylist.playlistType,
    targetDuration: parsedPlaylist.targetDuration,
    totalDuration: parsedPlaylist.totalDuration,
    discontinuityStarts: (parsedPlaylist.discontinuityStarts as number[]).join(
      ","
    ),
    videoId: video.id,
  };

  const playlist = await prisma.hlsPlaylist.upsert({
    where: {
      videoId: video.id,
    },
    create: playlistData,
    update: playlistData,
  });

  log.info(`Saved playlist with ID ${playlist.id} for video ${video.id}`);
  log.info(`Saving ${parsedPlaylist.segments.length} segments...`);
  try {
    const hlsSegmentsData = await Promise.all(
      parsedPlaylist.segments
        .map(async (parsedSegment: ParsedSegment, index: number) => {
          try {
            log.info(`Saving segment ${index}...`);
            const segmentPath = `${baseDir}/segment-${index}.ts`;
            const segment = fs.readFileSync(segmentPath);
            const segmentKey = `transcoded/${uploadId}/segment-${index}.ts`;
            await putObject({
              Bucket: process.env.AWS_S3_BUCKET,
              Key: segmentKey,
              Body: segment,
            });

            log.info(
              `Transcoded segment uploaded to S3 for upload ID: ${uploadId} - segment ${index}`
            );

            fs.unlinkSync(segmentPath);

            return {
              url: `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_S3_REGION}.amazonaws.com/${segmentKey}`,
              segmentNumber: index,
              resolution: parsedPlaylist.resolution,
              key: segmentKey,
              duration: parsedSegment.duration,
              byterangeOffset: parsedSegment.byterange?.offset,
              byterangeLength: parsedSegment.byterange?.length,
              discontinuity: parsedSegment.discontinuity,
              uri: parsedSegment.uri,
              timeline: parsedSegment.timeline,
              keyMethod: parsedSegment.key?.method,
              keyUri: parsedSegment.key?.uri,
              keyIv: parsedSegment.key?.iv,
              mapUri: parsedSegment.map?.uri,
              mapByterangeOffset: parsedSegment.map?.byterange?.offset,
              mapByterangeLength: parsedSegment.map?.byterange?.length,
              cueOut: parsedSegment["cue-out"],
              cueOutCont: parsedSegment["cue-out-cont"],
              cueIn: parsedSegment["cue-in"],
              custom: parsedSegment.custom,
              videoId: video.id,
              playlistId: playlist.id,
            } as Prisma.HlsSegmentCreateManyInput;
          } catch (error) {
            log.error(
              `Error saving segment ${index} for playlist ${playlist.id}`,
              { error }
            );
          }
        })
        .filter((data) => data)
    );

    await prisma.hlsSegment.createMany({
      data: hlsSegmentsData as Prisma.Enumerable<Prisma.HlsSegmentCreateManyInput>,
    });

    log.info("Original video uploaded to S3", { uploadId });

    await prisma.upload.update({
      where: {
        id: uploadId,
      },
      data: {
        transcoded: true,
      },
    });

    fs.unlinkSync(inputFileName);
    fs.unlinkSync(outputFilePath);
  } catch (error) {
    log.error(`Error transcoding video for upload ID: ${uploadId}`, { error });
  }
}

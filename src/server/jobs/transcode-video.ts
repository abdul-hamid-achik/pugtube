import { prisma } from "@/server/db";
import { createFFmpeg, streamToBuffer } from "@/utils/ffmpeg";
import { getObject, putObject } from "@/utils/s3";
import { log } from "@/utils/logger";
import os from "os";
// @ts-ignore
import { Parser } from "m3u8-parser";
import { Readable } from "stream";
import { Prisma } from "@prisma/client";

type ParsedSegment = {
  byterange: {
    length: number;
    offset: number;
  };
  duration: number;
  attributes: {};
  discontinuity: number;
  uri: string;
  timeline: number;
  key: {
    method: string;
    uri: string;
    iv: string;
  };
  map: {
    uri: string;
    byterange: {
      length: number;
      offset: number;
    };
  };
  "cue-out": string;
  "cue-out-cont": string;
  "cue-in": string;
  custom: {};
};

export default async function transcodeVideo({
  uploadId,
  fileName,
}: {
  uploadId: string;
  fileName: string;
}) {
  log.info("Transcoding video...");
  const ffmpeg = await createFFmpeg();
  const inputDirPath = `${os.tmpdir()}/input`;

  log.info(`Transcoding video for upload ID: ${uploadId}...`);

  const upload = await getObject({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `originals/${uploadId}/${fileName}`,
  });

  const inputFileName = fileName;
  const outputFileName = `${uploadId}.m3u8`;
  const buffer = await streamToBuffer(upload!.Body as Readable);
  await ffmpeg.FS("writeFile", inputFileName, new Uint8Array(buffer));

  ffmpeg.FS("mkdir", "output");

  await ffmpeg.run(
    "-i",
    inputFileName,
    "-c:v",
    "h264",
    "-preset",
    "fast",
    "-profile:v",
    "main",
    "-start_number",
    "0",
    "-vf",
    "scale=720:-2",
    "-hls_time",
    "3",
    "-hls_flags",
    "independent_segments",
    "-hls_segment_type",
    "mpegts",
    "-hls_segment_filename",
    `output/segment-%01d.ts`,
    "-hls_playlist_type",
    "vod",
    "-hls_list_size",
    "0",
    "-movflags",
    "+faststart",
    "-b:v",
    "800k",
    "-maxrate",
    "1000k",
    "-bufsize",
    "1200k",
    "-g",
    "12",
    "-keyint_min",
    "72",
    "-f",
    "hls",
    `output/${outputFileName}`
  );
  await ffmpeg.FS("unlink", inputFileName);

  const transcodedVideo = ffmpeg.FS("readFile", `output/${outputFileName}`);
  const transcodedVideoKey = `transcoded/${uploadId}/output.m3u8`;
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

  await ffmpeg.FS("unlink", `output/${outputFileName}`);

  const video = await prisma.video.findUniqueOrThrow({
    where: {
      uploadId: uploadId,
    },
  });

  const playlistData = {
    key: transcodedVideoKey,
    url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${transcodedVideoKey}`,
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
  log.debug(JSON.stringify(parsedPlaylist, null, 2), parsedPlaylist);
  try {
    const hlsSegmentsData: Prisma.Enumerable<Prisma.HlsSegmentCreateManyInput> =
      await Promise.all(
        parsedPlaylist.segments.map(
          async (parsedSegment: ParsedSegment, index: number) => {
            try {
              log.info(`Saving segment ${index}...`);
              const segmentPath = `output/segment-${index}.ts`;
              const segment = ffmpeg.FS("readFile", segmentPath);
              const segmentKey = `transcoded/${uploadId}/segment-${index}.ts`;
              await putObject({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: segmentKey,
                Body: segment,
              });

              log.info(
                `Transcoded segment uploaded to S3 for upload ID: ${uploadId} - segment ${index}`
              );
              await ffmpeg.FS("unlink", segmentPath);
              return {
                url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${segmentKey}`,
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
          }
        )
      );

    await prisma.hlsSegment.createMany({
      data: hlsSegmentsData,
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
  } catch (error) {
    log.error(`Error transcoding video for upload ID: ${uploadId}`, { error });
  }
  ffmpeg?.exit();
}

import { inngest } from '@/server/background';
import { prisma } from '@/server/db';
import { getObject, putObject } from '@/utils/s3';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { Upload, VideoMetadata } from '@prisma/client';
import fs from 'fs';
import { log } from 'next-axiom';
import os from 'os';
import { Readable } from 'stream';
// @ts-ignore
import { Parser } from 'm3u8-parser';

const ffmpeg = createFFmpeg({
    log: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',
    corePath: "/ffmpeg-core/ffmpeg-core.js",
});

type ParsedSegment = {
    byterange: {
        length: number,
        offset: number
    },
    duration: number,
    attributes: {},
    discontinuity: number,
    uri: string,
    timeline: number,
    key: {
        method: string,
        uri: string,
        iv: string
    },
    map: {
        uri: string,
        byterange: {
            length: number,
            offset: number
        }
    },
    'cue-out': string,
    'cue-out-cont': string,
    'cue-in': string,
    custom: {}
}

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
        '-hls_time', '4',
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
    const decoder = new TextDecoder();
    const transcodedVideoString = decoder.decode(transcodedVideo);

    const playlistParser = new Parser();
    playlistParser.push(transcodedVideoString)
    playlistParser.end()
    const parsedPlaylist = playlistParser.manifest

    log.info(`parsed playlist`, { parsedPlaylist })

    // Upload the transcoded video playlist to S3
    await putObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: transcodedVideoKey,
        Body: transcodedVideo,
    });

    const video = await prisma.video.findFirst({
        where: {
            uploadId: {
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
            key: transcodedVideoKey,
            url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${transcodedVideoKey}`,
            allowCache: parsedPlaylist.allowCache,
            discontinuitySequence: parsedPlaylist.discontinuitySequence,
            endList: parsedPlaylist.endList,
            mediaSequence: parsedPlaylist.mediaSequence,
            playlistType: parsedPlaylist.playlistType,
            targetDuration: parsedPlaylist.targetDuration,
            totalDuration: parsedPlaylist.totalDuration,
            discontinuityStarts: (parsedPlaylist.discontinuityStarts as number[]).join(','),
        },
    });

    log.info(`Saved playlist with ID ${playlist.id} for video ${video.id}`);
    log.info(`Saving ${parsedPlaylist.segments.length} segments...`)
    log.debug(JSON.stringify(parsedPlaylist, null, 2), parsedPlaylist)
    try {
        await Promise.all(parsedPlaylist.segments.map(
            async (parsedSegment: ParsedSegment, index: number) => {
                try {
                    log.info(`Saving segment ${index}...`)
                    const segmentPath = `output/segment-${index}.ts`;
                    const segment = ffmpeg.FS('readFile', segmentPath);
                    const segmentKey = `transcoded/${uploadId}/segment-${index}.ts`;

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
                            cueOut: parsedSegment['cue-out'],
                            cueOutCont: parsedSegment['cue-out-cont'],
                            cueIn: parsedSegment['cue-in'],
                            custom: parsedSegment.custom,
                        },
                    });

                    await putObject({
                        Bucket: process.env.AWS_S3_BUCKET,
                        Key: segmentKey,
                        Body: segment,
                    });


                    log.info(`Transcoded segment uploaded to S3 for upload ID: ${uploadId} - segment ${index}`);
                } catch (error) {
                    log.error(`Error saving segment ${index} for playlist ${playlist.id}`, { error })
                }

            }
        ))

        log.info(`Transcoded video uploaded to S3 for upload ID: ${uploadId}`);

        await putObject({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `originals/${uploadId}/${parsedUploadMetadata.filename}`,
            Body: await fetchFile(inputFilePath),
        });
        log.info('Original video uploaded to S3', { uploadId });

        await prisma.upload.update({
            where: {
                id: parsedUpload.id,
            },
            data: {
                transcoded: true,
            },
        });

        await inngest.send('pugtube/hls.transcoded', { data: { uploadId } })
    } catch (error) {
        log.error(`Error transcoding video for upload ID: ${uploadId}`, { error });
        throw error;
    }
});

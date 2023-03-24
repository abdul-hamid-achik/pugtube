import { prisma } from '@/server/db';
import { createFFmpeg, fetchFile } from '@/utils/ffmpeg';
import { getObject, putObject } from '@/utils/s3';
import fs from 'fs';
import { log } from 'next-axiom';
import os from 'os';
import { Readable } from 'stream';
// @ts-ignore
import { Parser } from 'm3u8-parser';


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

export default async function transcodeVideo({ uploadId, fileName }: { uploadId: string, fileName: string }) {
    log.info('Transcoding video...')
    const ffmpeg = await createFFmpeg();
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
        Key: `originals/${uploadId}/${fileName}`,
    });

    const inputFileName = fileName
    const inputFilePath = `${inputDirPath}/${inputFileName}`
    const inputStream = upload?.Body as Readable        // Derive the output file name
    const outputFileName = `${uploadId}.m3u8`;
    const writeStream = fs.createWriteStream(inputFilePath)

    await new Promise((resolve, reject) => {
        inputStream.pipe(writeStream);
        inputStream.on('error', reject);
        writeStream.on('error', reject);
        writeStream.on('finish', resolve);
    });

    log.info(`uploaded file: ${inputFilePath}`)

    log.info(`loaded ffmpeg`)
    await ffmpeg.FS('writeFile', inputFileName, await fetchFile(inputFilePath))
    log.info(`wrote file to ffmpeg`)
    ffmpeg.FS('mkdir', 'output');
    log.info(`created output directory`)

    // Transcode the video to HLS format
    await ffmpeg.run(
        '-i', inputFileName,
        '-c:v', 'h264',  // Use h264 codec instead of libx264
        '-profile:v', 'baseline', // Use the baseline H.264 profile
        '-codec', 'copy',
        '-start_number', '0',
        '-hls_time', '6', // Increase HLS segment duration to 6 seconds
        '-hls_flags', 'independent_segments',
        '-hls_segment_type', 'mpegts',
        '-hls_segment_filename', `output/segment-%01d.ts`,
        '-hls_playlist_type', 'vod',
        '-hls_list_size', '0',
        '-movflags', '+faststart',
        '-b:v', '800k', // Lower the video bitrate to 800k
        '-g', '12', // Set GOP size to 12 frames
        '-keyint_min', '72', // Set keyframe interval to 72 frames
        '-f', 'hls', `output/${outputFileName}`,
    );

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
            videoId: video.id,
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
            Key: `originals/${uploadId}/${fileName}`,
            Body: await fetchFile(inputFilePath),
        });
        log.info('Original video uploaded to S3', { uploadId });

        await prisma.upload.update({
            where: {
                id: uploadId,
            },
            data: {
                transcoded: true,
            },
        });

        await ffmpeg.FS('unlink', inputFileName);
        await ffmpeg.FS('unlink', `output/${outputFileName}`);
        await Promise.all(parsedPlaylist.segments.map(
            async (parsedSegment: ParsedSegment, index: number) => {
                await ffmpeg.FS('unlink', `output/segment-${index}.ts`);
            }
        ))
    } catch (error) {
        log.error(`Error transcoding video for upload ID: ${uploadId}`, { error });
        ffmpeg.exit();
        throw error;
    }

};

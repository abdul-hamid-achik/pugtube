import { prisma } from '@/server/db';
import { getSignedUrl } from '@/utils/s3';
import { HlsSegment } from '@prisma/client';
import ejs from 'ejs';
import fs from 'fs';
import { NextApiHandler } from 'next';

const watchHandler: NextApiHandler = async (req, res) => {
    const { videoId } = req.query as { videoId: string };
    const playlist = await prisma.hlsPlaylist.findFirst({
        where: { videoId },
        include: {
            segments: {
                orderBy: { key: 'asc' },
            },
        },
    });

    if (!playlist) {
        res.status(404).send('Not found');
        return;
    }

    const segments = await prisma.hlsSegment.findMany({
        where: { playlistId: playlist.id },
        orderBy: { key: 'asc' },
    });

    const targetDuration = segments.reduce((maxDuration: number, segment: HlsSegment) => {
        if (segment.duration && segment.duration > maxDuration) {
            return segment.duration;
        }
        return maxDuration;
    }, 0);

    const playlistTemplate = fs.readFileSync('./src/pages/api/watch/playlist.m3u8.ejs', 'utf-8');
    const renderedPlaylist = ejs.render(playlistTemplate, {
        targetDuration,
        playlist,
        segments: await Promise.all(playlist.segments.map(async (segment) => ({
            duration: segment.duration,
            byterange: segment.byterangeLength,
            url: await getSignedUrl(segment.url as string),
        }))),
    });

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.status(200).send(renderedPlaylist);
};

export default watchHandler;

// import { prisma } from '@/server/db';
// import { getSignedUrl } from '@/utils/s3';
// import { HlsPlaylist, HlsSegment } from '@prisma/client';
// import { NextApiRequest, NextApiResponse } from 'next';
// import { log as logger } from 'next-axiom';


// const createHlsPlaylist = async (playlist: HlsPlaylist, segments: HlsSegment[] = []): Promise<string> => {
//     if (!segments.length) {
//         return '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-ENDLIST\n';
//     }

//     let playlistString = '#EXTM3U\n#EXT-X-VERSION:3\n';
//     playlistString += `#EXT-X-PLAYLIST-TYPE:VOD\n`;
//     playlistString += `#EXT-X-TARGETDURATION:3\n`;
//     playlistString += `#EXT-X-VERSION:6\n`;
//     playlistString += `#EXT-X-MEDIA-SEQUENCE:${segments?.[0]?.segmentNumber}\n`;
//     playlistString += `#EXT-X-INDEPENDENT-SEGMENTS\n`;

//     await Promise.all(
//         segments.map(async (segment) => {
//             const signedUrl = await getSignedUrl(segment.url);
//             playlistString += `#EXTINF:${segment.duration.toFixed(3) + 1},\n${signedUrl}\n`;
//         })
//     );

//     playlistString += `#EXT-X-ENDLIST\n`;

//     return playlistString;
// };

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//     const videoId = req.query.videoId as string;
//     const log = logger.with({ videoId });
//     log.info('watching videoId', { videoId })

//     const playlist = await prisma.hlsPlaylist.findFirst({
//         where: { videoId },
//     });

//     log.info('playlist', { playlist })

//     if (!playlist) {
//         res.status(404).end();
//         return;
//     }

//     const segments = await prisma.hlsSegment.findMany({
//         where: { playlistId: playlist.id },
//         orderBy: { segmentNumber: 'asc' },
//     });

//     log.info('segments', { segments })

//     const playlistContent = await createHlsPlaylist(playlist, segments);
//     log.info("playlist content", { playlistContent })

//     res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
//     res.setHeader('Content-Length', playlistContent.length.toString());
//     res.end(playlistContent);
// }

import { prisma } from '@/server/db';
import { getSignedUrl } from '@/utils/s3';
import { HlsSegment } from '@prisma/client';
import ejs from 'ejs';
import fs from 'fs';
import { NextApiHandler } from 'next';

const watchHandler: NextApiHandler = async (req, res) => {
    const { videoId } = req.query;
    const playlist = await prisma.hlsPlaylist.findUnique({
        where: {
            id: String(videoId),
        },
        include: {
            segments: true,
        },
    });

    if (!playlist) {
        res.status(404).send('Not found');
        return;
    }
    const targetDuration = playlist.segments.reduce((maxDuration: number, segment: HlsSegment) => {
        if (segment.duration && segment.duration > maxDuration) {
            return segment.duration;
        }
        return maxDuration;
    }, 0);

    const playlistTemplate = fs.readFileSync('./playlist.m3u8.ejs', 'utf-8');
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

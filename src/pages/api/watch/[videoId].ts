import { prisma } from '@/server/db';
import { getSignedUrl } from '@/utils/s3';
import { HlsPlaylist, HlsSegment } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const createHlsPlaylist = (playlist: HlsPlaylist, segments: HlsSegment[] = []): string => {
    if (!segments.length) {
        return '#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-ENDLIST\n';
    }

    let playlistString = '#EXTM3U\n#EXT-X-VERSION:3\n';

    playlistString += `#EXT-X-MEDIA-SEQUENCE:${segments?.[0]?.segmentNumber}\n`;

    segments.forEach((segment) => {
        playlistString += `#EXTINF:${segment.duration.toFixed(3)},\n${segment.url}\n`;
    });

    playlistString += `#EXT-X-ENDLIST\n`;

    return playlistString;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const videoId = req.query.videoId as string;
    console.log('videoId', videoId)
    const playlist = await prisma.hlsPlaylist.findFirst({
        where: { videoId },
    });
    console.log('playlist', playlist, videoId)

    if (!playlist) {
        res.status(404).end();
        return;
    }

    const segments = await prisma.hlsSegment.findMany({
        where: { playlistId: playlist.id },
        orderBy: { segmentNumber: 'asc' },
    });

    const signedSegments = await Promise.all(
        segments.map(async (segment) => ({ ...segment, url: await getSignedUrl(segment.url) }))
    );

    const playlistContent = createHlsPlaylist(playlist, signedSegments);

    res.setHeader('Content-Type', 'application/x-mpegURL');
    res.setHeader('Content-Length', playlistContent.length.toString());
    res.end(playlistContent);
}

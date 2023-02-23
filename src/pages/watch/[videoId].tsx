import VideoPlayer from '@/components/video-player';
import { prisma } from '@/server/db';
import { Sha256 } from "@aws-crypto/sha256-browser";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { HttpRequest } from '@aws-sdk/protocol-http';
import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { parseUrl } from "@aws-sdk/url-parser";
import { HlsPlaylist, HlsSegment } from '@prisma/client';
import { GetServerSideProps, NextPage } from 'next';

interface WatchPageProps {
    playlistContent: string;
    segments: HlsSegment[];
}

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


const WatchPage: NextPage<WatchPageProps> = ({ playlistContent }) => {
    const playlistUrl = URL.createObjectURL(new Blob([playlistContent]));

    return (
        <div>
            <VideoPlayer src={playlistUrl} />
        </div>
    );
};

export const getServerSideProps: GetServerSideProps<WatchPageProps> = async ({ params }) => {
    const { videoId } = params as { videoId: string };
    const playlist = await prisma.hlsPlaylist.findFirst({
        where: { videoId: String(videoId) },
    });

    if (!playlist) {
        return {
            notFound: true,
        };
    }

    const segments = await prisma.hlsSegment.findMany({
        where: { playlistId: playlist.id },
        orderBy: { segmentNumber: 'asc' },
    });

    const signedSegments: HlsSegment[] = await Promise.all(
        segments.map(async (segment) => {
            // Replace `segmentKey` with the actual key of the segment object in your S3 bucket
            const command = new GetObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: segment.key,
            });

            const presigner = new S3RequestPresigner({
                region: process.env.AWS_REGION as string,
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
                },
                sha256: Sha256,
            });

            const s3ObjectUrl = parseUrl(`https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${segment.key}`);
            const signedUrl = await presigner.presign(new HttpRequest(s3ObjectUrl));
            console.log(signedUrl)
            return { ...segment, url: signedUrl.path };
        })
    );

    const playlistContent = createHlsPlaylist(playlist, signedSegments);

    return {
        props: {
            playlistContent,
            segments: signedSegments,
        },
    };
};

export default WatchPage;

import VideoPlayer from '@/components/video-player';
import { prisma } from '@/server/db';
import { GetServerSideProps, NextPage } from 'next';
interface WatchPageProps {
    playlistUrl: string;
    uploadId: string | undefined;
}



const WatchPage: NextPage<WatchPageProps> = ({ playlistUrl }) => {

    return (
        <div>
            <VideoPlayer src={playlistUrl} />
        </div>
    );
};

export const getServerSideProps: GetServerSideProps<WatchPageProps> = async ({ params }) => {
    const { videoId } = params as { videoId: string };
    const video = await prisma.video.findFirst({
        where: { id: String(videoId) },
        include: {
            upload: true,
        },
    });

    const playlist = await prisma.hlsPlaylist.findFirst({
        where: { videoId: String(videoId) },
    });

    const isVideoReady = video?.upload?.transcoded;


    if (isVideoReady) {
        return {
            props: {
                uploadId: video?.upload?.id,
                playlistUrl: `/api/watch/${videoId}.m3u8`,
            }
        };
    } else {
        return {
            props: {
                uploadId: video?.upload?.id,
                playlistUrl: '',
            }
        };
    }

};

export default WatchPage;

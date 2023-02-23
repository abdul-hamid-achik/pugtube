import VideoPlayer from '@/components/video-player';
import { prisma } from '@/server/db';
import { GetServerSideProps, NextPage } from 'next';
interface WatchPageProps {
    playlistUrl: string;
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
    const playlist = await prisma.hlsPlaylist.findFirst({
        where: { videoId: String(videoId) },
    });

    if (!playlist) {
        return {
            notFound: true,
        };
    }

    return {
        props: {
            playlistUrl: `/api/watch/${videoId}`,
        },
    };
};

export default WatchPage;

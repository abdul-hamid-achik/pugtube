import VideoPlayer from '@/components/video-player';
import { prisma } from '@/server/db';
import { clerkClient } from '@clerk/nextjs/server';
import { DateTime } from 'luxon';
import { GetServerSideProps, NextPage } from 'next';
import Image from 'next/image';
import Link from 'next/link';
interface WatchPageProps {
    playlistUrl: string;
    uploadId: string | undefined;
    title: string;
    description: string;
    category: string;
    author: string;
    authorProfileImageUrl: string;
    createdAt: string;
}



const WatchPage: NextPage<WatchPageProps> = ({ playlistUrl, ...props }) => {
    return (
        <div className="m-0 h-screen w-screen bg-gray-700">
            <div className="px-4">
                <h1 className="mb-4 text-xl text-white">{props?.title}</h1>
            </div>
            <div className="mx-4 pt-4">
                <VideoPlayer src={playlistUrl} />
            </div>
            <div className="flex justify-between px-4">
                <div>
                    <p className="mb-4 text-lg text-white">{props?.category}</p>
                    {props?.author &&
                        <div className="mt-2 flex items-center">
                            <Image
                                className="h-10 w-10 rounded-full object-cover shadow-sm"
                                src={props?.authorProfileImageUrl as string}
                                alt={props?.author as string}
                                width={40}
                                height={40}
                            />
                            <Link href={`/channel/${props?.author}`}
                                className="ml-2 font-medium text-white hover:text-gray-200">
                                {props?.author}
                            </Link>
                        </div>}
                    <p className="mb-4 text-lg text-white">{DateTime.fromISO(props?.createdAt).toRelative()}</p>
                </div>
            </div>
            <div className="px-4">
                <p className="mb-4 text-lg text-white">{props?.description}</p>
            </div>
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
    const isVideoReady = video?.upload?.transcoded;
    const author = await clerkClient.users.getUser(video?.userId as string);
    return {
        props: {
            uploadId: video?.upload?.id,
            playlistUrl: isVideoReady ? `/api/watch/${videoId}.m3u8` : '',
            title: video?.title || 'Unavailable',
            description: video?.description || '',
            category: video?.category || 'Uncategorized',
            author: author.username || 'Unknown',
            authorProfileImageUrl: author.profileImageUrl || '',
            createdAt: video?.createdAt?.toISOString() || new Date().toISOString(),
        }
    };

};

export default WatchPage;

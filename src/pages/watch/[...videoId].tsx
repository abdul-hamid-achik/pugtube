import Layout from '@/components/layout';
import VideoPlayer from '@/components/video-player';
import { NextPageWithLayout } from '@/pages/_app';
import { prisma } from '@/server/db';
import { getSignedUrl } from '@/utils/s3';
import { clerkClient } from '@clerk/nextjs/server';
import { DateTime } from 'luxon';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { ReactElement } from 'react';
interface PageProps {
    playlistUrl: string;
    uploadId: string | undefined;
    title: string;
    description: string;
    category: string;
    author: string;
    authorProfileImageUrl: string;
    poster: string;
    createdAt: string;
}



const Page: NextPageWithLayout<PageProps> = ({ playlistUrl, ...props }) => {
    return (<>
        <Head>
            <title>{props?.title}</title>
        </Head>
        <div className="m-0 h-fit w-full bg-gray-700">
            <div className="mx-4 pt-4">
                <VideoPlayer src={playlistUrl} poster={props.poster} />
            </div>
            <div className="flex flex-col p-4">
                <h1 className="pt-2 text-xl text-white">{props?.title}</h1>
                <p className="pt-2 text-sm text-gray-300">{DateTime.fromISO(props?.createdAt).toRelative()}</p>
                {props?.author &&
                    <div className="flex items-center py-2">
                        <Image
                            className="h-10 w-10 rounded-full object-cover shadow-sm"
                            src={props?.authorProfileImageUrl as string}
                            alt={props?.author as string}
                            width={40}
                            height={40}
                        />
                        <Link href={`/channel/${props?.author}`}
                            className="ml-2 font-medium text-gray-300 hover:text-gray-200">
                            @{props?.author}
                        </Link>
                    </div>}
            </div>

            {/* <div className="px-4">
                <p className="mb-4 text-lg text-white">{props?.description}</p>
            </div> */}
        </div>
    </>
    );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async ({ params }) => {
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
            poster: video?.thumbnailUrl ? await getSignedUrl(video?.thumbnailUrl as string) : '',
        }
    };

};


Page.getLayout = function getLayout(page: ReactElement) {
    return (
        <Layout>
            {page}
        </Layout>
    )
}

export default Page;

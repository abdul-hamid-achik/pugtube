import Layout from '@/components/layout';
import VideoCard from '@/components/video-card';
import { NextPageWithLayout } from '@/pages/_app';
import { prisma } from '@/server/db';
import { getSignedUrl } from '@/utils/s3';
import type { User } from '@clerk/nextjs/api';
import { clerkClient } from "@clerk/nextjs/server";
import { Video } from '@prisma/client';
import { GetServerSidePropsContext } from 'next';
import { ReactElement } from 'react';

interface PageProps {
    videos: Video[]
    user: User

}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const { username } = context.params as { username: string }

    const users = await clerkClient.users.getUserList({
        username: [username]
    })

    if (users.length === 0) {
        return {
            notFound: true
        }
    }


    const user = users[0] as User
    const { id: userId } = user

    const videos = await prisma.video.findMany({
        where: {
            userId
        }
    })

    return {
        props: {
            videos: JSON.parse(JSON.stringify(videos.map((video) => ({ ...video, thumbnailUrl: video.thumbnailUrl ? getSignedUrl(video.thumbnailUrl as string) : null })))),
            user: JSON.parse(JSON.stringify(user))
        }
    }
}

const Page: NextPageWithLayout<PageProps> = (props) => {
    return (
        <div className="m-0 w-full bg-gray-700">
            <h1 className="p-4 text-white">@{props.user.username} - Channel Page:</h1>
            <div className="flex h-screen w-full flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
                {props.videos.map((video) => (<VideoCard key={video.id} video={video} author={props.user} channel />))}
            </div>
        </div>
    )
}



Page.getLayout = function getLayout(page: ReactElement) {
    return (
        <Layout>
            {page}
        </Layout>
    )
}

export default Page;

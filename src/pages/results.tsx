import Layout from "@/components/layout";
import Spinner from "@/components/spinner";
import VideoCard from "@/components/video-card";
import { prisma } from "@/server/db";
import { api } from "@/utils/api";
import { getSignedUrl } from "@/utils/s3";
import { User } from "@clerk/nextjs/api";
import { clerkClient } from "@clerk/nextjs/server";
import { Video } from "@prisma/client";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { ReactElement } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { NextPageWithLayout } from "./_app";

interface ItemType {
    video: Video;
    author: User;
}

interface PageProps {
    initialData: {
        items: ItemType[];
        nextCursor: string | null;
    };
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const searchTerm = context.query.term as string;

    const searchResults = await prisma.video.findMany({
        take: 10,
        skip: 0,
        cursor: undefined,
        orderBy: {
            createdAt: 'desc',
        },
        where: {
            OR: [
                {
                    title: {
                        contains: searchTerm,
                    },
                },
                {
                    description: {
                        contains: searchTerm,
                    },
                },
                {
                    category: {
                        contains: searchTerm,
                    },
                },
            ],
            upload: {
                transcoded: true,
            },
        },
    });

    const authors = await clerkClient.users.getUserList({
        userId: searchResults.map((result) => result.userId),
    });

    const items = await Promise.all(
        searchResults.map(async (video) => ({
            video: {
                ...video,
                thumbnailUrl: video.thumbnailUrl ? await getSignedUrl(video.thumbnailUrl) : null,
            },
            author: authors.find((author) => author.id === video.userId)!,
        }))
    );

    return {
        props: {
            initialData: {
                items: JSON.parse(JSON.stringify(items)),
                nextCursor: null,
            },
        },
    };
}


const Page: NextPageWithLayout<PageProps> = ({ initialData }) => {
    const { query: { term } } = useRouter();
    const {
        data,
        fetchNextPage,
        isError,
        isLoading,
    } = api.video.search.useInfiniteQuery(
        {
            searchTerm: term as string || '',
            limit: 10,
            skip: 10,
        },
        {
            getNextPageParam: (lastPage) => lastPage.nextCursor,
            initialData: { pages: [initialData], pageParams: [undefined] },
        }
    );

    const hasNextPage = data?.pages.some((page) => !!page.nextCursor) || false;

    const fetchMoreSearchResults = () => {
        if (hasNextPage) {
            fetchNextPage();
        }
    };

    const items = data?.pages.flatMap((page) => page.items) || [];

    return (
        <div>
            {isLoading && (
                <div className="p-4">
                    <Spinner />
                </div>
            )}
            {isError && (
                <div className="p-4 text-center text-lg text-white">
                    <b>Something went wrong</b>
                </div>
            )}
            {items.length !== 0 ? (
                <InfiniteScroll
                    dataLength={items.length}
                    next={fetchMoreSearchResults}
                    hasMore={hasNextPage && items.length >= 10 && items.length % 10 === 0}
                    className="mx-auto max-w-xl"
                    loader={
                        <div className="p-4">
                            <Spinner />
                        </div>
                    }
                    endMessage={
                        <p className="p-4 text-center text-lg text-white">
                            <b>No more results</b>
                        </p>
                    }
                >
                    {items.map(({ video, author }) => (
                        <VideoCard key={video.id} video={video} author={author} searchResult />
                    ))}
                </InfiniteScroll>
            ) : (
                <div className="p-4 text-center text-lg text-white">
                    <b>No results found</b>
                </div>
            )}
        </div>
    );

};

Page.getLayout = function getLayout(page: ReactElement) {
    return <Layout>{page}</Layout>;
};

export default Page;

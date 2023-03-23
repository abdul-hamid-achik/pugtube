import Layout from '@/components/layout';
import Spinner from '@/components/spinner';
import VideoCard from '@/components/video-card';
import { NextPageWithLayout } from '@/pages/_app';
import { prisma } from '@/server/db';
import { api } from '@/utils/api';
import { getSignedUrl } from '@/utils/s3';
import { clerkClient } from '@clerk/nextjs/server';
import { Video } from '@prisma/client';
import { GetServerSidePropsContext } from 'next';
import { ReactElement } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';

export async function getServerSideProps(context: GetServerSidePropsContext) {
  let videos = await prisma.video.findMany({
    take: 9,
    skip: 0,
    cursor: undefined,
    orderBy: {
      createdAt: 'desc',
    },
    where: {
      upload: {
        transcoded: true
      }
    }
  })

  videos = await Promise.all(videos.map(async (video: Video) => ({ ...video, thumbnailUrl: video.thumbnailUrl ? await getSignedUrl(video.thumbnailUrl as string) : null })));

  const authors = await clerkClient.users.getUserList({
    userId: videos.map((video) => video.userId),
  });

  const items = videos.map((video) => ({
    video,
    author: authors.find((author) => author.id === video.userId)!,
  }));

  return {
    props: {
      initialData: {
        items: JSON.parse(JSON.stringify(items)),
        nextCursor: null,
      },
    },
  };
}

export const Page: NextPageWithLayout<{ initialData: any }> = ({ initialData }) => {
  const { data, error, isError, isLoading, fetchNextPage } = api.video.feed.useInfiniteQuery(
    {
      limit: 9,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialData: { pages: [initialData], pageParams: [undefined] },
    }
  );

  const hasNextPage = data?.pages.some((page) => !!page.nextCursor) || false;

  const fetchMoreData = () => {
    if (hasNextPage) {
      fetchNextPage();
    }
  };

  const items = data?.pages.flatMap((page) => page.items) || [];

  return (
    <section className="">
      {isError && (
        <div className="bg-red-400 text-white">
          <div className="p-4">
            <p>{error?.message}</p>
          </div>
        </div>
      )}
      {isLoading && <Spinner />}
      <InfiniteScroll
        dataLength={items.length}
        next={fetchMoreData}
        hasMore={hasNextPage}
        loader={
          <div className="p-4">
            <Spinner />
          </div>
        }
        endMessage={
          <p className="p-4 text-center text-lg text-white">
            <b>End of content</b>
          </p>
        }
      >
        <div className="w-full flex-col items-center justify-center gap-4 overflow-y-auto md:grid md:grid-cols-2 lg:grid-cols-3">
          {!isLoading &&
            !isError &&
            items.map(({ video, author }) => (
              <VideoCard key={video.id} video={video} author={author} />
            ))}
        </div>
      </InfiniteScroll>
    </section>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default Page;

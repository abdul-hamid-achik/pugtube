import Layout from '@/components/layout';
import Spinner from '@/components/spinner';
import VideoCard from '@/components/video-card';
import { NextPageWithLayout } from '@/pages/_app';
import { api } from '@/utils/api';
import { GetServerSidePropsContext } from 'next';
import { ReactElement } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return {
    props: {}
  }
}

export const Page: NextPageWithLayout = () => {
  const { data, error, isError, isLoading, fetchNextPage } = api.video.feed.useInfiniteQuery({
    limit: 10,
  }, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    // initialCursor: 1
  });

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
        loader={<Spinner />}
        endMessage={
          <p className="text-center">
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

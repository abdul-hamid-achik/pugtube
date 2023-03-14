import Layout from '@/components/layout';
import Spinner from '@/components/spinner';
import VideoCard from '@/components/video-card';
import { NextPageWithLayout } from '@/pages/_app';
import { api } from '@/utils/api';
import { GetServerSidePropsContext } from 'next';
import { ReactElement, useEffect, useRef, useState } from 'react';

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return {
    props: {}
  }
}

export const Page: NextPageWithLayout = () => {
  const [page, setPage] = useState(0);
  const { data, error, isError, isLoading, fetchNextPage } = api.video.feed.useInfiniteQuery({
    limit: 10,
  }, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    // initialCursor: 1
  });
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading) return;

    let current = loaderRef.current;
    const options = {
      root: null,
      rootMargin: '20px',
      threshold: 1.0,
    };

    const observer = new IntersectionObserver((entries = []) => {
      if (entries.length > 0 && entries[0]!.isIntersecting) {
        setPage((prevPage) => prevPage + 1);
      }
    }, options);

    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [loaderRef, isLoading]);

  useEffect(() => {
    fetchNextPage();
  }, [page, fetchNextPage]);

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
      <div className="w-full flex-col items-center justify-center gap-4 overflow-y-auto md:grid md:grid-cols-2 lg:grid-cols-3">
        {!isLoading &&
          !isError &&
          data?.pages[page]?.items.map(({ video, author }) => (
            <VideoCard key={video.id} video={video} author={author} />
          ))}
        <div ref={loaderRef}></div>
      </div>
    </section>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default Page;

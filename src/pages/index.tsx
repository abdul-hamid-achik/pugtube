import Spinner from "@/components/spinner";
import VideoCard from "@/components/video-card";
import { NextPageWithLayout } from "@/pages/_app";
import { api } from "@/utils/api";
import { User } from "@clerk/nextjs/api";
import { Video } from "@prisma/client";
import { GetServerSidePropsContext } from "next";
import { useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

type InitialData = {
  items: Array<{
    video: Video;
    author: User;
  }>;
  nextCursor: null;
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { getFeed } = await import("@/utils/shared");
  const { items } = await getFeed({
    limit: 9,
    skip: 0,
  });

  return {
    props: {
      initialData: {
        items: JSON.parse(JSON.stringify(items)),
        nextCursor: null,
      },
    },
  };
}

export const Page: NextPageWithLayout<{ initialData: InitialData }> = ({
  initialData,
}) => {
  const [enabled, setEnabled] = useState(false);
  const { data, error, isError, isLoading, fetchNextPage } =
    api.videos.feed.useInfiniteQuery(
      {
        limit: 9,
        skip: 9,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialData: { pages: [initialData], pageParams: [undefined] },
        enabled: enabled,
      }
    );

  const fetchMoreData = () => {
    if (hasNextPage) {
      fetchNextPage().catch((err) => {
        console.error(err);
      });
    }
  };

  const lastPage = data?.pages[data.pages.length - 1];
  const hasNextPage = !!lastPage?.nextCursor;
  const items = data?.pages.flatMap((page) => page.items) || [];

  const handleScroll = () => {
    setEnabled(true);
  };

  return (
    <section className="" onScroll={handleScroll}>
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
        <div className="flex-col items-center justify-center gap-4 overflow-y-auto sm:grid-cols-1 md:grid md:grid-cols-2 lg:grid-cols-3">
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

export default Page;

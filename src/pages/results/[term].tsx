import Layout from "@/components/layout";
import Spinner from "@/components/spinner";
import VideoCard from "@/components/video-card";
import { api } from "@/utils/api";
import { User } from "@clerk/nextjs/api";
import { Video } from "@prisma/client";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { ReactElement } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { NextPageWithLayout } from "../_app";
import Head from "next/head";

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
  const { getSearchResults } = await import("@/utils/shared");

  const searchTerm = context.query.term as string;
  const { items, nextCursor = null } = await getSearchResults({
    searchTerm,
    limit: 10,
    skip: 0,
  });

  return {
    props: {
      initialData: {
        items: JSON.parse(JSON.stringify(items)),
        nextCursor,
      },
    },
  };
}

const Page: NextPageWithLayout<PageProps> = ({ initialData }) => {
  const {
    query: { term },
  } = useRouter();
  const { data, fetchNextPage, isError, isLoading } =
    api.videos.search.useInfiniteQuery(
      {
        searchTerm: (term as string) || "",
        limit: 10,
        skip: 10,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialData: { pages: [initialData], pageParams: [undefined] },
        enabled: false,
      }
    );

  const hasNextPage = data?.pages.some((page) => !!page.nextCursor) || false;

  const fetchMoreSearchResults = () => {
    if (hasNextPage) {
      fetchNextPage().catch(
        (err) => console.error(err) // eslint-disable-line no-console
      );
    }
  };

  const items = data?.pages.flatMap((page) => page.items) || [];

  return (
    <>
      <Head>
        <meta name="description" content={`Search results for ${term}`} />
        <meta property="og:title" content={`Search results for ${term}`} />
        <meta
          property="og:description"
          content={`Search results for ${term}`}
        />
        <meta
          property="og:url"
          content={`https://pugtube.dev/results/${term}`}
        />
        <meta property="og:type" content="website" />
      </Head>
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
            hasMore={
              hasNextPage && items.length >= 10 && items.length % 10 === 0
            }
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
              <VideoCard
                key={video.id}
                video={video}
                author={author}
                searchResult
              />
            ))}
          </InfiniteScroll>
        ) : (
          <div className="p-4 text-center text-lg text-white">
            <b>No results found</b>
          </div>
        )}
      </div>
    </>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default Page;

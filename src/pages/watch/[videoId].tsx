import CommentCard from "@/components/comment";
import Layout from "@/components/layout";
import LikeButton from "@/components/like";
import Spinner from "@/components/spinner";
import VideoPlayer from "@/components/video-player";
import { NextPageWithLayout } from "@/pages/_app";
import { prisma } from "@/server/db";
import { api } from "@/utils/api";
import { log } from "@/utils/logger";
import { connection } from "@/utils/redis";
import { useAuth } from "@clerk/nextjs";
import { User } from "@clerk/nextjs/api";
import { getAuth } from "@clerk/nextjs/server";
import { Disclosure } from "@headlessui/react";
import { Comment, Prisma } from "@prisma/client";
import { DateTime, Duration } from "luxon";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { ReactElement } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import InfiniteScroll from "react-infinite-scroll-component";

interface PageProps {
  keywords: string[];
  playlistUrl: string;
  likeId: string | null;
  videoId: string;
  uploadId: string | undefined;
  title: string;
  description: string;
  category: string;
  author: string;
  authorProfileImageUrl: string;
  poster: string;
  createdAt: string;
  duration: number;
  initialData: {
    items: CommentItem[];
    nextCursor: string | null;
  };
}

type CommentItem = {
  comment: Comment | { createdAt: string; updatedAt: string };
  author: User;
  parentComment?: Comment | { createdAt: string; updatedAt: string };
};

type Inputs = { text: string };

const MemoizedCommentCard = React.memo(CommentCard);

const MemoizedLikeButton = React.memo(LikeButton);

function getRandomIndex(arrayLength: number) {
  return Math.floor(Math.random() * arrayLength);
}

export const getServerSideProps: GetServerSideProps<PageProps> = async ({
  params,
  req,
}) => {
  const { getVideoData, getComments } = await import("@/utils/shared");
  const IORedis = await import("ioredis").then((m) => m.default);
  const { userId } = await getAuth(req);
  let { videoId } = params as { videoId: string };
  if (videoId === "random") {
    let findManyArgs: Prisma.VideoFindManyArgs = {
      select: {
        id: true,
      },
    };

    if (userId) {
      findManyArgs = {
        ...findManyArgs,
        where: {
          userId: userId!,
        },
      } as Prisma.VideoFindManyArgs;
    }

    const videos = await prisma.video.findMany(findManyArgs);

    const randomIndex = getRandomIndex(videos.length);
    const randomVideoId = videos[randomIndex]!.id;

    return {
      redirect: {
        destination: `/watch/${randomVideoId}`,
        permanent: false,
      },
    };
  }
  const { video, author, like } = await getVideoData(videoId);
  const { items, nextCursor = null } = await getComments({
    videoId,
    limit: 9,
  });

  // TODO: This is a hack to get the keywords to show up in the meta tags
  const key = `video:${videoId}`;
  let keywords: string[] | null;

  // attempt to retrieve the keywords from Redis
  const cachedKeywords = await connection.get(key);
  if (cachedKeywords) {
    keywords = JSON.parse(cachedKeywords);
  } else {
    keywords = Array.from(
      new Set(
        video?.thumbnails
          ?.flatMap((t: any) => [
            ...t.contentTags.flatMap((ct: any) =>
              ct.name.split(",").map((keyword: string) => keyword.trim())
            ),
            t.caption,
          ])
          .filter((keyword: string) => keyword?.length > 0) || []
      )
    );
    const ttl = 24 * 60 * 60; // 24 hours in seconds
    await connection
      .multi()
      .set(key, JSON.stringify(keywords))
      .expire(key, ttl)
      .exec();
  }

  const isVideoReady = video?.upload?.transcoded;
  return {
    props: {
      videoId,
      keywords: keywords || [],
      likeId: like?.id || null,
      uploadId: video?.upload?.id,
      playlistUrl: isVideoReady ? `/api/watch/${videoId}.m3u8` : "",
      title: video?.title || "Unavailable",
      description: video?.description || "",
      category: video?.category || "Uncategorized",
      author: author.username || "Unknown",
      authorProfileImageUrl: author.profileImageUrl || "",
      createdAt:
        typeof video?.createdAt === "object"
          ? (video?.createdAt as Date).toISOString() || new Date().toISOString()
          : video?.createdAt,
      poster: video?.thumbnailUrl || "",
      duration: video?.duration || 0,
      initialData: {
        items: items as CommentItem[],
        nextCursor,
      },
    },
  };
};

const Page: NextPageWithLayout<PageProps> = ({
  playlistUrl,
  initialData,
  ...props
}) => {
  const router = useRouter();
  const { register, handleSubmit, reset } = useForm<Inputs>();
  const { isSignedIn, userId } = useAuth();
  const {
    data: commentData,
    error: commentError,
    isError: isCommentError,
    isLoading: isCommentLoading,
    fetchNextPage: fetchNextCommentPage,
    refetch: refetchComments,
  } = api.social.comments.useInfiniteQuery(
    {
      videoId: props.videoId,
      limit: 9,
      skip: initialData.items.length < 9 ? 0 : initialData.items.length,
    },
    {
      getNextPageParam: (lastPage) => lastPage?.nextCursor,
      initialData: { pages: [initialData], pageParams: [] },
      refetchInterval: 10000,
      enabled: false,
    }
  );

  const { data: likes, refetch: refetchLikes } = api.social.likes.useQuery({
    videoId: props.videoId,
  });

  const { mutate } = api.social.comment.useMutation({
    onSuccess: () => {
      reset();
      refresh();
    },
  });

  const hasNextCommentPage =
    commentData?.pages.some((page) => !!page?.nextCursor) || false;

  const fetchMoreCommentData = () => {
    if (hasNextCommentPage) {
      fetchNextCommentPage().then((r: any) => {
        return log.info(r);
      });
    }
  };

  const commentItems = commentData?.pages?.flatMap((page) => page?.items) || [];

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    mutate({
      videoId: props.videoId,
      text: data.text,
    });
  };

  const refresh = () => {
    Promise.all([refetchComments(), refetchLikes()]).catch((err) => {
      log.error(err);
    });
  };
  return (
    <>
      <Head>
        <meta name="description" content={props.description} />
        <meta name="keywords" content={props.category} />
        <meta name="application-name" content="PugTube" />
        <meta name="author" content={props.author} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@pugtube" />
        <meta name="twitter:title" content={props.title} />
        <meta name="twitter:description" content={props.description} />
        <meta name="twitter:image" content={props.poster} />
        <meta name="twitter:creator" content={`@${props.author}`} />
        <meta name="twitter:creator:id" content={props.author} />
        <meta property="og:type" content="video.other" />
        <meta property="og:site_name" content="PugTube" />
        <meta
          property="og:url"
          content={`https://pugtube.dev/watch/${props.videoId}`}
        />
        <meta property="og:title" content={props.title} />
        <meta property="og:description" content={props.description} />
        <meta property="og:image" content={props.poster} />
        <meta property="og:video" content={playlistUrl} />
        <meta property="og:video:secure_url" content={playlistUrl} />
        <meta property="og:video:type" content="application/x-mpegURL" />
        <meta property="og:video:width" content="720" />
        <meta property="og:video:height" content="480" />
        <meta property="og:video:tag" content={props.category} />
        <meta property="og:video:tag" content={props.author} />
        <meta property="og:video:tag" content={props.title} />
        <meta property="og:video:tag" content={props.description} />
        <meta property="og:video:tag" content="PugTube" />
        <meta name="keywords" content={props.keywords.join(", ")} />
      </Head>
      <div className="m-0 mx-auto flex h-fit flex-col bg-gray-700 sm:w-full md:flex-row lg:max-w-6xl">
        <div className="mx-auto flex w-full flex-1 flex-col sm:p-0 md:p-4">
          <VideoPlayer src={playlistUrl} poster={props.poster} />
          <div className="flex flex-col bg-gray-500 py-2 px-4">
            <Disclosure>
              {({ open }) => (
                <>
                  <Disclosure.Button className="block">
                    <div className="mb-2 flex w-full items-center justify-between">
                      <div className="flex flex-1 flex-row">
                        <h1
                          className="text-xl text-white"
                          data-testid="video-title"
                        >
                          {props?.title}
                        </h1>
                        <p
                          className="ml-4 pt-1 align-middle text-sm text-gray-300"
                          data-testid="video-created-at"
                        >
                          {DateTime.fromISO(props?.createdAt).toRelative()}
                        </p>
                      </div>
                      <div className="flex items-center self-end">
                        <MemoizedLikeButton
                          videoId={props.videoId}
                          likeId={props.likeId}
                          refresh={refresh}
                        />
                        <span
                          className="mr-4 text-xs text-white"
                          data-testid="video-likes"
                        >
                          {likes || 0}
                        </span>
                        {isSignedIn && userId === props.author && (
                          <Link
                            href={`/channel/${props.author}/video/${props.videoId}`}
                          >
                            Edit
                          </Link>
                        )}
                      </div>
                    </div>
                    {props?.author && (
                      <div
                        className="flex items-center py-2"
                        data-testid="video-author"
                      >
                        <Image
                          className="h-10 w-10 rounded-full object-cover shadow-sm"
                          src={props?.authorProfileImageUrl as string}
                          alt={props?.author as string}
                          width={40}
                          height={40}
                        />
                        <Link
                          href={`/channel/${props?.author}`}
                          className="ml-2 w-40 font-medium text-gray-300 hover:text-gray-200"
                          data-testid="video-author-channel"
                        >
                          @{props?.author}
                        </Link>

                        <div className="flex w-full justify-end">
                          <p className="text-white">
                            {!open ? "...more" : "close"}
                          </p>
                        </div>
                      </div>
                    )}
                  </Disclosure.Button>
                  <Disclosure.Panel className="text-sm text-gray-300 sm:p-2">
                    <div className="flex flex-col">
                      <div className="flex flex-row">
                        <p className="text-sm text-gray-300">Category:</p>
                        <p className="ml-2 text-sm text-white">
                          {props.category}
                        </p>
                      </div>
                      <div className="flex flex-row">
                        <p className="text-sm text-gray-200">Author:</p>
                        <p className="ml-2 text-sm text-white">
                          <Link href={`/channel/${props.author}`}>
                            {props.author}
                          </Link>
                        </p>
                      </div>
                      <div className="flex flex-row">
                        <p className="text-sm text-gray-200">Description:</p>
                        <p className="ml-2 text-sm text-white">
                          {props.description}
                        </p>
                      </div>
                      <div className="flex flex-row">
                        <p className="text-sm text-gray-200">Keywords:</p>
                        <div className="ml-4 max-h-96 overflow-y-auto">
                          {props.keywords?.map((keyword) => (
                            <span
                              key={keyword}
                              onClick={() => {
                                router
                                  .push(`/results/${keyword}`)
                                  .catch((err) => log.error(err));
                              }}
                              className="inline-flex cursor-pointer items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-800 hover:underline"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>

            {isSignedIn ? (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-4"
                data-testid="video-add-comment-form"
              >
                <div className="mb-4">
                  <textarea
                    {...register("text")}
                    className="h-32 w-full rounded border border-gray-600 bg-gray-800 p-2 text-white"
                    placeholder="Add a comment"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
                >
                  Submit
                </button>
              </form>
            ) : (
              <div className="mt-4 flex w-96 flex-row">
                <Link
                  href="/sign-in/"
                  className="mr-1 flex text-white underline hover:bg-gray-600"
                >
                  Sign in
                </Link>
                <p className="mr-1 text-white">or</p>
                <Link
                  href="/sign-up/"
                  className="mr-1 flex text-white underline hover:bg-gray-600"
                >
                  Sign up
                </Link>
                <p className="text-white">to comment</p>
              </div>
            )}
          </div>
        </div>

        {commentItems?.length > 0 && (
          <div className="h-fit w-full flex-1 flex-col items-center justify-center gap-4 overflow-y-auto border-r-0 border-solid border-gray-50 p-4 sm:max-w-full md:max-w-sm md:border-r md:border-gray-50">
            {isCommentLoading && (
              <div className="w-fit py-4">
                <Spinner />
              </div>
            )}
            {isCommentError && (
              <div className="bg-red-400 text-white">
                <div className="p-4">
                  <p>{commentError?.message}</p>
                </div>
              </div>
            )}
            <InfiniteScroll
              dataLength={commentItems.length}
              next={fetchMoreCommentData}
              hasMore={hasNextCommentPage}
              style={{
                minHeight: "calc(100vh - 24rem)",
              }}
              loader={
                <div className="p-4">
                  <Spinner />
                </div>
              }
              endMessage={
                <p className="p-4 text-center text-lg text-white">
                  <b>End of comments</b>
                </p>
              }
            >
              <div
                className="flex w-full flex-col items-center justify-center gap-4 overflow-y-auto"
                data-testid="video-comments"
              >
                {!isCommentLoading &&
                  !isCommentError &&
                  commentItems
                    ?.filter((props) => props)
                    .map((props) => (
                      <MemoizedCommentCard
                        key={(props.comment as Comment).id}
                        comment={props.comment as Comment}
                        author={props.author}
                        parentComment={props.parentComment as Comment}
                      />
                    ))}
              </div>
            </InfiniteScroll>
          </div>
        )}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "http://schema.org",
            "@type": "VideoObject",
            name: props.title,
            description: props.description,
            thumbnailUrl: props.poster,
            uploadDate: props.createdAt,
            duration: Duration.fromObject({
              seconds: props.duration,
            }).toISOTime({ includePrefix: true }),
            contentUrl: `https://pugtube.dev/api/watch/${props.videoId}.m3u8`,
            embedUrl: `https://pugtube.dev/embed/${props.videoId}`,
            author: {
              "@type": "Person",
              name: props.author,
              url: `https://pugtube.dev/channel/${props.author}`,
            },
            publisher: {
              "@type": "Organization",
              name: "PugTube",
              logo: {
                "@type": "ImageObject",
                url: "https://pugtube.dev/logo.png", // Replace with the URL to your site's logo
                width: 200, // Replace with the width of your logo
                height: 60, // Replace with the height of your logo
              },
            },
            interactionStatistic: {
              "@type": "InteractionCounter",
              interactionType: {
                "@type": "http://schema.org/LikeAction",
              },
              userInteractionCount: likes,
            },
            genre: props.category,
          }),
        }}
      />
    </>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default Page;

// async function generateMetadata({
//   params,
// }: {
//   params: { videoId: string };
// }): Promise<Metadata> {
//   const { getVideoData } = await import("@/utils/shared");
//   const { videoId } = params;
//   const { video, author } = await getVideoData(videoId);
//
//   return {
//     title: video!.title,
//     description: video!.description,
//     applicationName: "PugTube",
//     keywords: video!.category, // TODO: Add more keywords
//     authors: [
//       {
//         name: author.username!,
//         url: `https://pugtube.dev/channel/${author.username}`,
//       },
//     ],
//     twitter: {
//       site: "@pugtube",
//       title: video!.title,
//       description: video!.description as string,
//       images: video!.thumbnailUrl,
//       creator: `@${author.username!}`,
//       creatorId: author.id,
//     },
//     openGraph: {
//       type: "video.other",
//       siteName: "PugTube",
//       url: `https://pugtube.dev/watch/${video.id}`,
//       title: video!.title,
//       description: video!.description as string,
//       images: video!.thumbnailUrl,
//     },
//     category: video!.category as string,
//     creator: author.username!,
//     publisher: "PugTube",
//   };
// }

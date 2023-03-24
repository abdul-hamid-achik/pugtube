import CommentCard from '@/components/comment';
import Layout from '@/components/layout';
import LikeButton from '@/components/like';
import Spinner from '@/components/spinner';
import VideoPlayer from '@/components/video-player';
import { NextPageWithLayout } from '@/pages/_app';
import { api } from '@/utils/api';
import { useAuth } from '@clerk/nextjs';
import { User } from '@clerk/nextjs/api';
import { Comment } from '@prisma/client';
import { DateTime, Duration } from 'luxon';
import { GetServerSideProps, Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import React, { ReactElement } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import InfiniteScroll from 'react-infinite-scroll-component';

interface PageProps {
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
    }
}

type CommentItem = {
    comment: Comment | { createdAt: string; updatedAt: string };
    author: User;
    parentComment?: Comment | { createdAt: string; updatedAt: string };
};

type Inputs = { text: string }


const MemoizedCommentCard = React.memo(CommentCard);

const MemoizedLikeButton = React.memo(LikeButton);


export async function generateMetadata({ params }: {
    params: { videoId: string };
}): Promise<Metadata> {
    const { getVideoData } = await import('@/utils/shared');
    const { videoId } = params;
    const { video, author } = await getVideoData(videoId);

    return {
        title: video!.title,
        description: video!.description,
        applicationName: 'PugTube',
        keywords: video!.category, // TODO: Add more keywords
        authors: [{
            name: author.username!,
            url: `https://pugtube.dev/channel/${author.username}`,
        }],
        twitter: {
            site: '@pugtube',
            title: video!.title,
            description: video!.description as string,
            images: video!.thumbnailUrl,
            creator: `@${author.username!}`,
            creatorId: author.id,
        },
        openGraph: {
            type: 'video.other',
            siteName: 'PugTube',
            url: `https://pugtube.dev/watch/${video.id}`,
            title: video!.title,
            description: video!.description as string,
            images: video!.thumbnailUrl,
        },
        category: video!.category as string,
        creator: author.username!,
        publisher: 'PugTube',
    };
}

export const getServerSideProps: GetServerSideProps<PageProps> = async ({ params }) => {
    const { getVideoData, getComments } = await import('@/utils/shared');
    const { videoId } = params as { videoId: string };
    const { video, author, like } = await getVideoData(videoId);
    const { items } = await getComments({
        videoId,
        limit: 9,
    });

    const isVideoReady = video?.upload?.transcoded;
    return {
        props: {
            videoId,
            likeId: like?.id || null,
            uploadId: video?.upload?.id,
            playlistUrl: isVideoReady ? `/api/watch/${videoId}.m3u8` : '',
            title: video?.title || 'Unavailable',
            description: video?.description || '',
            category: video?.category || 'Uncategorized',
            author: author.username || 'Unknown',
            authorProfileImageUrl: author.profileImageUrl || '',
            createdAt: video?.createdAt?.toISOString() || new Date().toISOString(),
            poster: video?.thumbnailUrl || '',
            duration: video?.duration || 0,
            initialData: {
                items: items as CommentItem[],
                nextCursor: null,
            }
        }
    };
};

const Page: NextPageWithLayout<PageProps> = ({ playlistUrl, initialData, ...props }) => {
    const { register, handleSubmit, reset } = useForm<Inputs>();
    const { isSignedIn } = useAuth();
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
            enabled: initialData.items.length === 9
        }
    );

    const { data: likes, refetch: refetchLikes } = api.social.likes.useQuery({
        videoId: props.videoId,
    });

    const { mutate } = api.social.comment.useMutation({
        onSuccess: () => {
            reset();
            refresh();
        }
    });

    const hasNextCommentPage = commentData?.pages.some((page) => !!page?.nextCursor) || false;

    const fetchMoreCommentData = () => {
        if (hasNextCommentPage) {
            fetchNextCommentPage();
        }
    };

    const commentItems = (commentData?.pages?.flatMap((page) => page?.items) || []);

    const onSubmit: SubmitHandler<Inputs> = async (data) => {
        mutate({
            videoId: props.videoId,
            text: data.text,
        })
    };

    const refresh = () => {
        refetchComments();
        refetchLikes();
    }
    return (<>
        <div className="m-0 mx-auto flex h-fit w-fit bg-gray-700" >
            <div className="mx-auto flex flex-1 flex-col p-4">
                <VideoPlayer src={playlistUrl} poster={props.poster} />
                <div className="flex flex-col p-4 ">
                    <div className="mb-2 flex items-center justify-between">
                        <div className="flex flex-row">
                            <h1 className="text-xl text-white">{props?.title}</h1>
                            <p className="ml-4 pt-1 align-middle text-sm text-gray-300">{DateTime.fromISO(props?.createdAt).toRelative()}</p>
                        </div>
                        <div className="flex items-center self-end">
                            <MemoizedLikeButton videoId={props.videoId} likeId={props.likeId} refresh={refresh} />
                            <span className="mr-4 text-xs text-white">
                                {likes || 0}
                            </span>
                        </div>
                    </div>
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
                    {isSignedIn && <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
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
                    </form>}
                </div>
            </div>
            <div className="my-auto h-fit w-full max-w-sm flex-col items-center justify-center gap-4 overflow-y-auto border-r-0 border-solid border-gray-50 p-4">
                {isCommentLoading && <div className="w-fit py-4"><Spinner /></div>}
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
                        minHeight: 'calc(100vh - 24rem)',
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
                    <div className="flex w-full flex-col items-center justify-center gap-4 overflow-y-auto">
                        {!isCommentLoading &&
                            !isCommentError &&
                            commentItems?.filter(props => props).map((props) => (
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

        </div>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                    "@context": "http://schema.org",
                    "@type": "VideoObject",
                    "name": props.title,
                    "description": props.description,
                    "thumbnailUrl": props.poster,
                    "uploadDate": props.createdAt,
                    "duration": Duration.fromObject({ seconds: props.duration }).toISOTime({ includePrefix: true }),
                    "contentUrl": `https://pugtube.dev/api/watch/${props.videoId}.m3u8`,
                    "embedUrl": `https://pugtube.dev/embed/${props.videoId}`,
                    "author": {
                        "@type": "Person",
                        "name": props.author,
                        "url": `https://pugtube.dev/channel/${props.author}`
                    },
                    "publisher": {
                        "@type": "Organization",
                        "name": "PugTube",
                        "logo": {
                            "@type": "ImageObject",
                            "url": "https://pugtube.dev/logo.png", // Replace with the URL to your site's logo
                            "width": 200, // Replace with the width of your logo
                            "height": 60 // Replace with the height of your logo
                        }
                    },
                    "interactionStatistic": {
                        "@type": "InteractionCounter",
                        "interactionType": {
                            "@type": "http://schema.org/LikeAction"
                        },
                        "userInteractionCount": likes
                    },
                    "genre": props.category
                })
            }}
        />

    </>
    );
};



Page.getLayout = function getLayout(page: ReactElement) {
    return (
        <Layout>
            {page}
        </Layout>
    )
}

export default Page;

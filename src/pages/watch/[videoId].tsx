import CommentCard from '@/components/comment';
import Layout from '@/components/layout';
import Spinner from '@/components/spinner';
import VideoPlayer from '@/components/video-player';
import { NextPageWithLayout } from '@/pages/_app';
import { prisma } from '@/server/db';
import { api } from '@/utils/api';
import { getSignedUrl } from '@/utils/s3';
import { useAuth } from '@clerk/nextjs';
import { clerkClient, User } from '@clerk/nextjs/api';
import { Comment } from '@prisma/client';
import { DateTime } from 'luxon';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { ReactElement } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import InfiniteScroll from 'react-infinite-scroll-component';
interface PageProps {
    playlistUrl: string;
    videoId: string;
    uploadId: string | undefined;
    title: string;
    description: string;
    category: string;
    author: string;
    authorProfileImageUrl: string;
    poster: string;
    createdAt: string;
    initialData: {
        items: Comment[];
        nextCursor: string | null;
    }
}

type CommentItem = {
    comment: Comment;
    author: User;
    parentComment?: Comment;
};

type Inputs = { text: string }

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
            videoId,
            uploadId: video?.upload?.id,
            playlistUrl: isVideoReady ? `/api/watch/${videoId}.m3u8` : '',
            title: video?.title || 'Unavailable',
            description: video?.description || '',
            category: video?.category || 'Uncategorized',
            author: author.username || 'Unknown',
            authorProfileImageUrl: author.profileImageUrl || '',
            createdAt: video?.createdAt?.toISOString() || new Date().toISOString(),
            poster: video?.thumbnailUrl ? await getSignedUrl(video?.thumbnailUrl as string) : '',
            initialData: {
                items: [],
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
    } = api.social.getCommentsForVideo.useInfiniteQuery(
        {
            videoId: props.videoId,
            limit: 9,
        },
        {
            getNextPageParam: (lastPage) => lastPage?.nextCursor,
            initialData: { pages: [initialData], pageParams: [] },
            refetchInterval: 10000,
        }
    );
    const { mutate } = api.social.addCommentToVideo.useMutation({
        onSuccess: () => {
            reset();
            refetchComments();
        }
    });

    const hasNextCommentPage = commentData?.pages.some((page) => !!page?.nextCursor) || false;

    const fetchMoreCommentData = () => {
        if (hasNextCommentPage) {
            fetchNextCommentPage();
        }
    };

    const commentItems = (commentData?.pages?.flatMap((page) => page?.items) || []) as unknown as CommentItem[];

    const onSubmit: SubmitHandler<Inputs> = async (data) => {
        mutate({
            videoId: props.videoId,
            text: data.text,
        })
    };

    return (<>
        <Head>
            <title>{props?.title}</title>
        </Head>
        <div className="m-0 mx-auto flex h-fit w-fit bg-gray-700" >
            <div className="mx-auto flex flex-1 flex-col p-4">
                <VideoPlayer src={playlistUrl} poster={props.poster} />
                <div className="flex flex-col p-4 ">
                    <div className="mb-2 flex flex-row">
                        <h1 className="text-xl text-white">{props?.title}</h1>
                        <p className="ml-4 pt-1 align-middle text-sm text-gray-300">{DateTime.fromISO(props?.createdAt).toRelative()}</p>
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

            {commentItems.length > 0 &&
                <div className="my-auto w-full max-w-sm flex-col items-center justify-center gap-4 overflow-y-auto border-r-0 border-solid border-gray-50 p-4" style={{
                    maxHeight: 'calc(100vh - 12rem)',
                }}>
                    {isCommentError && (
                        <div className="bg-red-400 text-white">
                            <div className="p-4">
                                <p>{commentError?.message}</p>
                            </div>
                        </div>
                    )}
                    {isCommentLoading && <div className="py-4"><Spinner /></div>}

                    <InfiniteScroll
                        dataLength={commentItems.length}
                        next={fetchMoreCommentData}
                        hasMore={hasNextCommentPage}
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
                                    <CommentCard
                                        key={props.comment.id}
                                        comment={props.comment}
                                        author={props.author}
                                        parentComment={props.parentComment}
                                    />
                                ))}
                        </div>
                    </InfiniteScroll>
                </div>
            }
        </div>
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

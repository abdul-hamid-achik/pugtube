import { api } from '@/utils/api';
import { HeartIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';
import Spinner from './spinner';

export interface LikeButtonProps {
    videoId?: string;
    commentId?: string;
    likeId?: string | null;
}

export default function LikeButton({ videoId, commentId, likeId: likeIdProps }: LikeButtonProps) {
    const [likeId, setLikeId] = useState(likeIdProps ? likeIdProps : null);
    const isLiked = likeId !== null;
    const { data: likeData, refetch, isError, isLoading } = api.social.getLike.useQuery(likeId as string, {
        enabled: isLiked
    });

    const { mutate: like, isLoading: isLiking } = api.social.like.useMutation({
        onSuccess: (data) => {
            setLikeId(data.id);
            refetch();
        }
    });

    const { mutate: unlike, isLoading: isUnliking } = api.social.unlike.useMutation({
        onSuccess: (_) => {
            setLikeId(null)
            refetch();
        }
    });


    if (!videoId && !commentId) {
        return null;
    }

    if (isLiking || isUnliking) {
        return (
            <Spinner className="h-6 w-6" />
        )
    }

    if (likeId && likeData && !isError) {
        return (
            <button
                className="mr-2 flex h-6 w-6 items-center justify-center rounded-full text-pink-300 hover:text-pink-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                onClick={() => {
                    unlike(likeId)
                }}
                disabled={isUnliking}
            >
                <HeartIcon className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only">Unlike</span>
            </button>
        )
    }

    return (
        <button
            className="mr-2 flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
            onClick={() => {
                if (videoId) {
                    like({ videoId });
                }
                if (commentId) {
                    like({ commentId });
                }
            }}
            disabled={isLiking}
        >
            <HeartIcon className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Like</span>
        </button>
    );
}

import { api } from "@/utils/api";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as SolidHeartIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import Spinner from "./spinner";

export interface LikeButtonProps {
  videoId?: string;
  commentId?: string;
  likeId?: string | null;
  refresh?: () => void;
}

export default function LikeButton({
  videoId,
  commentId,
  likeId: likeIdProps,
  refresh,
}: LikeButtonProps) {
  const [likeId, setLikeId] = useState(likeIdProps ? likeIdProps : null);
  const isLiked = !!likeId;
  const {
    data: likeData,
    refetch,
    isError,
    isLoading,
    isFetching,
  } = api.social.getLike.useQuery(likeId as string, {
    enabled: isLiked,
  });

  const { mutate: like, isLoading: isLiking } = api.social.like.useMutation({
    onSuccess: (data) => {
      setLikeId(data.id);
      refetch().then(() => {
        refresh?.();
      });
    },
  });

  const { mutate: unlike, isLoading: isUnliking } =
    api.social.unlike.useMutation({
      onSuccess: (_) => {
        setLikeId(null);
        refetch?.();
      },
    });

  return (
    <span
      className={`mr-2 flex h-6 w-6 items-center justify-center rounded-full 
      text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 ${
        isLiking ? "cursor-none" : "cursor-pointer"
      }`}
      onClick={() => {
        if (likeId) {
          unlike((likeId || likeData?.id) as string);
        } else {
          if (videoId) {
            like({ videoId });
          }
          if (commentId) {
            like({ commentId });
          }
        }
      }}
      data-testid="like-button"
    >
      {isLiking || isUnliking || (isLoading && isFetching) ? (
        <Spinner className="h-4 w-4" />
      ) : (likeId || likeData) && !isError ? (
        <>
          <SolidHeartIcon className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Unlike</span>
        </>
      ) : (
        <>
          <HeartIcon className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">Like</span>
        </>
      )}
    </span>
  );
}

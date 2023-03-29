/* eslint-disable no-param-reassign */
import { User } from "@clerk/nextjs/api";
import type { Video } from "@prisma/client";
import { DateTime } from "luxon";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { useAuth } from "@clerk/nextjs";

interface VideoCardProps {
  video: Video;
  author: User;
  channel?: boolean;
  searchResult?: boolean;
}

export default function VideoCard({
  video,
  author,
  channel,
  searchResult = false,
}: VideoCardProps) {
  const [failedToLoad, setFailedToLoad] = useState(false);
  const [playGif, setPlayGif] = useState(false);
  const { userId, isSignedIn } = useAuth();

  const onError = (_: React.SyntheticEvent<HTMLImageElement>) =>
    setFailedToLoad(true);

  const onMouseEnter = () => setPlayGif(true);
  const onMouseLeave = () => setPlayGif(false);
  const style = {
    maxHeight: searchResult ? "96px" : "240px",
  };
  return (
    <div
      className={
        searchResult
          ? "m-auto flex flex-row items-center border-b-2 border-gray-200 bg-gray-800 shadow-sm"
          : "h-fit rounded-md bg-white shadow-md"
      }
    >
      <Link
        style={style}
        href={
          channel && isSignedIn && userId === author.id
            ? `/channel/${author.username}/video/${video.id}`
            : `/watch/${video.id}`
        }
      >
        {video.thumbnailUrl && !failedToLoad ? (
          <Image
            src={
              playGif && video.previewUrl
                ? (video.previewUrl as string)
                : (video.thumbnailUrl as string)
            }
            alt={video.title}
            width={searchResult ? 170 : 420}
            height={searchResult ? 96 : 240}
            style={style}
            className="h-60 w-96 object-cover"
            onError={onError}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          />
        ) : (
          <Image
            src="/images/video-placeholder.jpg"
            className="h-60 w-96 object-cover"
            alt={video.title}
            width={searchResult ? 170 : 420}
            height={searchResult ? 96 : 240}
          />
        )}
      </Link>
      <div
        className={
          searchResult
            ? "flex w-full flex-row justify-between"
            : "flex flex-row justify-between"
        }
      >
        <div className="flex-1 p-4 pr-0">
          <Link
            className={`block text-lg font-medium hover:text-gray-400 ${
              searchResult ? "text-white" : "text-black"
            } `}
            href={`/watch/${video.id}`}
          >
            {video.title}
          </Link>
          <p className="text-gray-400">
            {DateTime.fromISO(
              typeof video?.createdAt === "object"
                ? video.createdAt.toISOString()
                : video.createdAt
            ).toRelative()}
          </p>
        </div>
        {author && (
          <div className="flex flex-col items-end p-4 pl-0">
            <Image
              className="h-10 w-10 rounded-full object-cover shadow-sm"
              src={author?.profileImageUrl as string}
              alt={author?.username as string}
              width={40}
              height={40}
            />
            <Link
              href={`/channel/${author?.username}`}
              className="ml-2 text-sm text-gray-400 hover:text-gray-600"
            >
              @{author?.username}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

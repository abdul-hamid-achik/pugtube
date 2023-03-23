/* eslint-disable no-param-reassign */
import { User } from '@clerk/nextjs/api';
import type { Video } from '@prisma/client';
import { DateTime } from 'luxon';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';


interface VideoCardProps {
  video: Video;
  author: User;
  channel?: boolean;
  searchResult?: boolean;
}

export default function VideoCard({ video, author, channel, searchResult = false }: VideoCardProps) {
  const [failedToLoad, setFailedToLoad] = useState(false);

  const onError = (event: React.SyntheticEvent<HTMLImageElement>) => setFailedToLoad(true);

  return (
    <div className={searchResult ? "flex flex-row items-center border-b-2 border-gray-200 bg-gray-800 shadow-sm" : "h-fit rounded-md bg-white shadow-md"}>
      <Link href={channel ? `/channel/${author.username}/video/${video.id}` : `/watch/${video.id}`}>
        {video.thumbnailUrl && !failedToLoad ? <Image
          src={video.thumbnailUrl as string}
          alt={video.title}
          onError={onError}
          width={searchResult ? 170 : 720}
          height={searchResult ? 96 : 405}

        /> : <Image src="/images/video-placeholder.jpg" alt={video.title}
          width={searchResult ? 170 : 720}
          height={searchResult ? 96 : 405}
        />}
      </Link>
      <div className={searchResult ? "flex w-full flex-row justify-between" : "flex flex-row justify-between"}>
        <div className="flex-1 p-4 pr-0">
          <Link className={`block text-lg font-medium hover:text-gray-200 ${searchResult ? 'text-white' : 'text-black'} `} href={`/watch/${video.id}`}>
            {video.title}
          </Link>
          <p className="text-gray-400">{DateTime.fromISO(typeof video?.createdAt === "object" ? video.createdAt.toISOString() : video.createdAt).toRelative()}</p>
        </div>
        {author &&
          <div className="flex flex-col items-end p-4 pl-0">
            <Image
              className="h-10 w-10 rounded-full object-cover shadow-sm"
              src={author?.profileImageUrl as string}
              alt={author?.username as string}
              width={40}
              height={40}
            />
            <Link href={`/channel/${author?.username}`}
              className="ml-2 text-sm text-gray-400 hover:text-gray-600">
              @{author?.username}
            </Link>
          </div>}
      </div>
    </div>
  );
}

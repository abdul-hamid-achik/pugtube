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
}

export default function VideoCard({ video, author, channel }: VideoCardProps) {
  const [failedToLoad, setFailedToLoad] = useState(false);

  const onError = (event: React.SyntheticEvent<HTMLImageElement>) => setFailedToLoad(true);

  return (
    <div className="max-h-fit rounded-md bg-white shadow-md">
      <Link href={channel ? `/channel/${author.username}/video/${video.id}` : `/watch/${video.id}`}>
        {video.thumbnailUrl && !failedToLoad ? <Image
          src={video.thumbnailUrl as string}
          alt={video.title}
          onError={onError}
          width={720}
          height={480}
        /> : <Image src="/images/video-placeholder.jpg" alt={video.title} width={720} height={480} />}
      </Link>
      <div className="flex flex-row justify-between">
        <div className="flex-1 p-4">
          <Link className="block text-lg font-medium text-gray-800 hover:text-gray-600" href={`/watch/${video.id}`}>
            {video.title}
          </Link>
          <p className="text-gray-400">{DateTime.fromISO(typeof video?.createdAt === "object" ? video.createdAt.toISOString() : video.createdAt).toRelative()}</p>
        </div>
        {author &&
          <div className="flex flex-col items-end p-4">
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

/* eslint-disable no-param-reassign */
import { User } from '@clerk/nextjs/api';
import type { Video } from '@prisma/client';
import { DateTime } from 'luxon';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';


interface VideoCardProps {
  video: Video;
  author: User
}

export default function VideoCard({ video, author }: VideoCardProps) {
  const [failedToLoad, setFailedToLoad] = useState(false);

  const onError = (event: React.SyntheticEvent<HTMLImageElement>) => setFailedToLoad(true);

  return (
    <div className="overflow-hidden rounded-md bg-white shadow-md">
      <Link href={`/watch/${video.id}`}>
        {video.thumbnailUrl && !failedToLoad ? <Image
          src={video.thumbnailUrl as string}
          alt={video.title}
          onError={onError}
          width={720}
          height={480}
        /> : <Image src="/images/video-placeholder.jpg" alt={video.title} width={720} height={480} />}
      </Link>
      <div className="p-4">
        <Link className="block text-lg font-medium text-gray-800 hover:text-gray-600" href={`/watch/${video.id}`}>
          {video.title}
        </Link>
        <p className="text-gray-500">{video.description}</p>
        <p className="text-gray-500">{DateTime.fromISO(video.createdAt.toISOString()).toRelative()}</p>

        {author &&
          <div className="mt-2 flex items-center">
            <Image
              className="h-10 w-10 rounded-full object-cover shadow-sm"
              src={author?.profileImageUrl as string}
              alt={author?.username as string}
              width={40}
              height={40}
            />
            <Link href={`/channel/${author?.id}`}
              className="ml-2 font-medium text-gray-800 hover:text-gray-600">
              {author?.username}
            </Link>
          </div>}
      </div>
    </div>
  );
}

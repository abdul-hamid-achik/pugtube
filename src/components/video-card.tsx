/* eslint-disable no-param-reassign */
import type { Video } from '@prisma/client';
import Image from 'next/image';
import Link from 'next/link';

interface VideoCardProps {
  video: Video;
}

export default function VideoCard({ video }: VideoCardProps) {
  const onError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = '/images/video-unavailable.png';
  };

  return (
    <div className="overflow-hidden rounded-md bg-white shadow-md">
      <Link href={`/watch/${video.id}`}>
        {video.thumbnailUrl && <Image
          src={video.thumbnailUrl as string}
          alt={video.title}
          onError={onError}
          width={720}
          height={480}
        />}
      </Link>
      <div className="p-4">
        <Link className="block text-lg font-medium text-gray-800 hover:text-gray-600" href={`/watch/${video.id}`}>
          {video.title}
        </Link>
        <p className="text-gray-500">{video.description}</p>
        <p className="text-gray-500">{video.createdAt.toISOString()}</p>
        <div className="mt-2 flex items-center">
          {/* <Image
                className="w-10 h-10 object-cover rounded-full shadow-sm"
                src={video?.author?.avatarUrl as string}
                alt={video?.author?.name as string}
            />
            <Link href={`/channel/${video?.author?.id}`}
                 className="ml-2 text-gray-800 font-medium hover:text-gray-600">
                {video?.author?.name}
            </Link> */}
        </div>
      </div>
    </div>
  );
}

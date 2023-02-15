/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import Link from "next/link";
import Image from "next/image";
import type { Video } from '@prisma/client'

interface VideoCardProps {
    video: Video;
}

export default function VideoCard({ video }: VideoCardProps) {
    const onError = (event: React.SyntheticEvent<HTMLImageElement>) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = "/images/video-unavailable.png";
    };

    return (
        <div className="bg-white rounded-md shadow-md overflow-hidden">
            <Link href={`/watch/${video.id}`}>
                <a>
                    <Image
                        src={video.thumbnailUrl as string}
                        alt={video.title}
                        onError={onError}
                        width={720}
                        height={480}
                    />
                </a>
            </Link>
            <div className="p-4">
                <Link href={`/watch/${video.id}`}>
                    <a className="block text-lg font-medium text-gray-800 hover:text-gray-600">{video.title}</a>
                </Link>
                <p className="text-gray-500">{video.description}</p>
                <div className="flex items-center mt-2">
                    <Image
                        className="w-10 h-10 object-cover rounded-full shadow-sm"
                        src={video.author.avatarUrl as string}
                        alt={video.author.name as string}
                    />
                    <Link href={`/channel/${video.author.id}`}>
                        <a className="ml-2 text-gray-800 font-medium hover:text-gray-600">{video.author.name}</a>
                    </Link>
                </div>
            </div>
        </div>
    );
}

import { User } from '@clerk/nextjs/api';
import { Comment } from "@prisma/client";
import { DateTime } from 'luxon';
import Image from 'next/image';
import Link from 'next/link';

interface ComponentCardProps {
    comment: Comment;
    author: User;
    parentComment?: Comment;
}

function CommentCard({ comment, author, parentComment }: ComponentCardProps) {
    return <div className="flex w-full flex-col border-b border-gray-50">
        <div className="flex flex-1 flex-row items-start justify-start">
            <Link href={`/channel/${author.id}`}>
                <Image src={author.profileImageUrl} alt={`${author.username} channel`} className="rounded-full" width={24} height={24} />
            </Link>
            <div className="ml-4 flex items-center ">
                <Link href={`/channel/${author.id}`} className="mr-2 rounded-full text-xs font-medium text-gray-300 hover:text-gray-200">
                    {author.username}
                </Link>
                <p className="text-xs text-gray-400">{DateTime.fromISO(typeof comment?.createdAt === "object" ? comment.createdAt.toISOString() : comment.createdAt).toRelative()}</p>
            </div>
        </div>
        <p className="my-2 justify-start text-sm text-gray-200">{comment.text}</p>
        {parentComment && (
            <blockquote className="border-l-2 border-gray-500 pl-4">
                <p className="text-gray-300">
                    <em>{`"${parentComment.text}"`}</em>
                </p>
            </blockquote>
        )}
    </div>
};

export default CommentCard;

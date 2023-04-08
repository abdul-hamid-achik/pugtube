import { prisma } from "@/server/db";
import { getSignedUrl } from "@/utils/s3";
import { SignedInAuthObject, SignedOutAuthObject } from "@clerk/nextjs/api";
import { clerkClient } from "@clerk/nextjs/server";

export async function getVideoData(
  videoId: string,
  ctx: { prisma: typeof prisma } = { prisma }
) {
  const video = await ctx.prisma.video.findUniqueOrThrow({
    where: { id: String(videoId) },
    include: {
      thumbnails: {
        include: {
          contentTags: true,
        },
      },
      upload: {
        include: {
          metadata: true,
        },
      },
    },
  });

  const metadata = await ctx.prisma.videoMetadata.findUnique({
    where: {
      uploadId: video?.uploadId as string,
    },
  });

  const userId = video?.userId as string;

  const [author, like, thumbnailUrl, previewUrl] = await Promise.all([
    clerkClient.users.getUser(userId),
    ctx.prisma.like.findFirst({
      where: {
        videoId: videoId,
        userId: userId,
      },
    }),
    video?.thumbnailUrl ? getSignedUrl(video?.thumbnailUrl) : "",
    video?.previewUrl ? getSignedUrl(video?.previewUrl) : "",
  ]);

  return {
    video: {
      ...video,
      upload: {
        ...video?.upload,
        metadata: {
          ...(metadata || {}),
        },
      },
      thumbnailUrl,
      previewUrl,
      analyzedAt: video?.analyzedAt?.toISOString(),
      createdAt: video?.createdAt?.toISOString(),
      thumbnails: video?.thumbnails.map((thumbnail) => ({
        ...thumbnail,
      })),
    },
    like,
    author,
  };
}

export async function getFeed({
  limit = 9,
  skip = 0,
  cursor,
  ctx = { prisma },
}: {
  limit?: number | null;
  cursor?: string | null;
  skip?: number | null;
  ctx?: { prisma: typeof prisma };
}) {
  let videos = await ctx.prisma.video.findMany({
    take: limit! + 1,
    skip: skip!,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: {
      createdAt: "desc",
    },
    where: {
      upload: {
        transcodedAt: {
          not: null,
        },
      },
    },
  });

  const userIds = videos.map((video) => video.userId);
  const [authors, thumbnailUrls, previewUrls] = await Promise.all([
    clerkClient.users.getUserList({
      userId: userIds,
    }),
    Promise.all(
      videos.map((video) =>
        video.thumbnailUrl ? getSignedUrl(video.thumbnailUrl) : null
      )
    ),
    Promise.all(
      videos.map((video) =>
        video.previewUrl ? getSignedUrl(video.previewUrl) : null
      )
    ),
  ]);

  const authorMap = new Map(authors.map((author) => [author.id, author]));

  const items = videos.map((video, index) => ({
    video: {
      ...video,
      thumbnailUrl: thumbnailUrls[index],
      previewUrl: previewUrls[index],
    },
    author: authorMap.get(video.userId),
  }));

  let nextCursor: typeof cursor | undefined = undefined;
  if (items.length > limit!) {
    const nextItem = items.pop();
    nextCursor = nextItem!.video!.id;
  }

  return {
    items,
    nextCursor,
  };
}

export async function getSearchResults({
  limit = 5,
  skip = 0,
  searchTerm,
  cursor,
  ctx = { prisma },
}: {
  limit?: number | null;
  skip?: number | null;
  searchTerm: string;
  cursor?: string | null;
  ctx?: { prisma: typeof prisma };
}) {
  let videos = await ctx.prisma.video.findMany({
    take: limit! + 1,
    skip: skip || 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      thumbnails: {
        include: {
          contentTags: true,
        },
      },
      upload: {
        include: {
          metadata: true,
        },
      },
    },
    where: {
      OR: [
        {
          title: {
            contains: searchTerm,
          },
        },
        {
          description: {
            contains: searchTerm,
          },
        },
        {
          category: {
            contains: searchTerm,
          },
        },
        {
          thumbnails: {
            some: {
              contentTags: {
                some: {
                  name: {
                    contains: searchTerm,
                  },
                },
              },
            },
          },
        },
        {
          thumbnails: {
            some: {
              caption: {
                contains: searchTerm,
              },
            },
          },
        },
      ],
      upload: {
        transcodedAt: {
          not: null,
        },
      },
    },
  });

  const userIds = videos.map((video) => video.userId);
  const [authors, thumbnailUrls] = await Promise.all([
    clerkClient.users.getUserList({
      userId: userIds,
    }),
    Promise.all(
      videos.map((video) =>
        video.thumbnailUrl ? getSignedUrl(video.thumbnailUrl) : null
      )
    ),
  ]);

  const authorMap = new Map(authors.map((author) => [author.id, author]));

  const items = videos.map((video, index) => ({
    video: { ...video, thumbnailUrl: thumbnailUrls[index] },
    author: authorMap.get(video.userId),
  }));

  let nextCursor: typeof cursor | undefined = undefined;
  if (items.length > limit!) {
    const nextItem = items.pop();
    nextCursor = nextItem!.video!.id;
  }

  return {
    items,
    nextCursor,
  };
}

export async function getComments({
  videoId,
  limit = 9,
  skip = 0,
  cursor,
  ctx = { prisma },
}: {
  videoId: string;
  limit?: number | null;
  skip?: number | null;
  cursor?: string | null;
  ctx?: {
    prisma: typeof prisma;
    auth?: SignedInAuthObject | SignedOutAuthObject;
  };
}) {
  const comments = await ctx.prisma.comment.findMany({
    where: {
      videoId,
    },
    take: limit! + 1,
    skip: skip! || 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      parentComment: true,
    },
  })!;

  const userIds = comments.map((comment) => comment.userId);
  const authors = await clerkClient.users.getUserList({
    userId: userIds,
  });

  const authorMap = new Map(authors.map((author) => [author.id, author]));

  const currentUserId = ctx?.auth?.userId;
  const userLikesPromise = currentUserId
    ? ctx.prisma.like.findMany({
        where: {
          userId: currentUserId,
          commentId: {
            in: comments.map((comment) => comment.id),
          },
        },
      })
    : Promise.resolve([]);

  const userLikes = await userLikesPromise;
  const userLikeMap = new Map(
    userLikes.map((like) => [like.commentId, like.id])
  );

  let nextCursor: string | null = null;
  if (comments.length > limit!) {
    const nextComment = comments.pop();
    nextCursor = nextComment!.id;
  }

  return {
    items: comments.map((comment) => {
      const author = JSON.parse(
        JSON.stringify(authorMap.get(comment.userId) || {})
      );
      const parentCommentAuthor = comment.parentComment
        ? JSON.parse(
            JSON.stringify(authorMap.get(comment.parentComment.userId) || {})
          )
        : null;

      return {
        comment: {
          ...comment,
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt.toISOString(),
          likeId: userLikeMap.get(comment.id) || null,
        },
        author: author,
        parentComment: comment.parentComment
          ? {
              ...comment.parentComment,
              author: parentCommentAuthor,
            }
          : null,
      };
    }),
    nextCursor,
  };
}

export async function getLikes({
  videoId,
  commentId,
  ctx = { prisma },
}: {
  videoId?: string;
  commentId?: string;
  ctx?: { prisma: typeof prisma };
}) {
  return await ctx.prisma.like.count({
    where: {
      OR: [
        {
          videoId,
        },
        {
          commentId,
        },
      ],
    },
  });
}

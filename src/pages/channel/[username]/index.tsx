import Layout from "@/components/layout";
import VideoCard from "@/components/video-card";
import { NextPageWithLayout } from "@/pages/_app";
import { prisma } from "@/server/db";
import { getSignedUrl } from "@/utils/s3";
import type { User } from "@clerk/nextjs/api";
import { clerkClient } from "@clerk/nextjs/server";
import { Video } from "@prisma/client";
import { GetServerSidePropsContext } from "next";
import { ReactElement } from "react";

interface PageProps {
  videos: Video[];
  user: User;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { username } = context.params as { username: string };

  const [user] = await clerkClient.users.getUserList({
    username: [username],
  });

  if (!user) {
    return {
      notFound: true,
    };
  }

  const { id: userId } = user;

  const videos = await prisma.video.findMany({
    where: {
      userId,
    },
  });

  const formattedVideos = videos.map(async (video) => ({
    ...video,
    thumbnailUrl: video.thumbnailUrl
      ? await getSignedUrl(video.thumbnailUrl as string)
      : null,
    previewUrl: video.previewUrl ? await getSignedUrl(video.previewUrl) : null,
    createdAt: video.createdAt?.toISOString() || null,
    analyzedAt: video.analyzedAt?.toISOString() || null,
  }));

  return {
    props: {
      videos: await Promise.all(formattedVideos),
      user: {
        username: user.username,
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || null,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      },
    },
  };
}

const Page: NextPageWithLayout<PageProps> = (props) => {
  return (
    <div className="m-0 w-full bg-gray-700">
      <h1 className="p-4 text-white">@{props.user.username} - Channel Page:</h1>
      <div className="grid h-screen w-full justify-center gap-4 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
        {props.videos.map((video) => (
          <VideoCard key={video.id} video={video} author={props.user} channel />
        ))}
      </div>
    </div>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <Layout>{page}</Layout>;
};

export default Page;

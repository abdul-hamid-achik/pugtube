import { prisma } from "@/server/db";
import { GetServerSidePropsContext } from "next";
import { Asset, Upload } from "@prisma/client";
import superjson from "superjson";
import React from "react";
import Json from "@/components/json";
import { getSignedUrl } from "@/utils/s3";
import Link from "next/link";

interface PageProps {
  upload: Upload & { assets: Asset[] };
  videoId: string;
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { uploadId } = ctx.params as { uploadId: string };
  const upload = await prisma.upload.findUniqueOrThrow({
    where: {
      id: uploadId,
    },

    include: {
      assets: true,
    },
  });

  const { id: videoId } = await prisma.video.findUniqueOrThrow({
    where: {
      uploadId: uploadId,
    },
    select: {
      id: true,
    },
  });

  const { json } = superjson.serialize(upload);

  return {
    props: {
      videoId,
      upload: {
        // @ts-ignore
        ...json,
        assets: await Promise.all(
          // @ts-ignore
          json!.assets!.map(async (asset: any) => ({
            ...asset,
            url: await getSignedUrl(asset.url),
          }))
        ),
      },
    },
  };
}
function Page(props: PageProps) {
  return (
    <div className="w-screen p-4 text-white">
      <h1 className="mb-4 font-extrabold">Upload</h1>
      <p className="mb-4 font-extralight">
        See the video{" "}
        <Link
          className="text-gray-50 underline hover:text-gray-200"
          href={`/watch/${props.videoId}`}
        >
          here
        </Link>
      </p>
      <ul>
        {props.upload.assets.map((asset) => (
          <li key={asset.id}>
            <Json json={asset} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Page;

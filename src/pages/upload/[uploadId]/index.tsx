import Spinner from "@/components/spinner";
import { api } from "@/utils/api";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { type Job } from "bullmq";
import { DateTime } from "luxon";
import { useAuth } from "@clerk/nextjs";
// @ts-ignore
import { Treebeard } from "react-treebeard";

function flattenTree(node: any) {
  const children = node.children || [];
  return [node, ...children.flatMap((child: any) => flattenTree(child))];
}

const StatusIconHeader = ({ node }: { node: any }) => {
  const Icon = node.value ? CheckIcon : XMarkIcon;
  const iconClass = node.value ? "text-green-500" : "text-red-500";

  return (
    <div className="flex items-center">
      <Icon className={`h-6 w-6 ${iconClass}`} />
      <span className="ml-2 font-medium text-white">{node.name}</span>
    </div>
  );
};

const StatusIconContainer = (props: any) => {
  const { node, onClick } = props;
  return (
    <div className="cursor-pointer bg-gray-900 p-4 shadow" onClick={onClick}>
      <StatusIconHeader node={node} />
    </div>
  );
};

export default function Page() {
  const {
    query: { uploadId },
  } = useRouter();
  const { userId, isSignedIn } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const { data: upload } = api.videos.upload.useQuery(uploadId as string, {
    enabled: !!uploadId,
    refetchInterval: 5_000,
  });

  const { data: segments = [] } = api.videos.segments.useQuery(
    uploadId as string,
    {
      enabled: !!uploadId,
      refetchInterval: 5_000,
    }
  );
  const { data: { video } = {} } = api.videos.video.useQuery(
    {
      uploadId: uploadId as string,
    },
    {
      enabled: !!uploadId,
      refetchInterval: 5_000,
    }
  );

  const { data: author } = api.social.author.useQuery(video?.userId as string, {
    enabled: !!video?.userId,
    refetchInterval: 5_000,
  });

  const { data: { id: jobId } = {}, mutate: enqueue } =
    api.background.enqueue.useMutation({
      onSuccess: (data) => {
        setJobs((jobs) => [...jobs, data]);
      },
    });

  const { data: results = [] } = api.background.jobs.useQuery(
    jobs?.map(({ id }) => id!),
    {
      enabled: !!jobId,
      refetchInterval: 2_000,
    }
  );

  const treeData = {
    name: "Moved upload to originals folder",
    toggled: true,
    onClick() {
      enqueue({
        name: "move-upload",
        payload: {
          uploadId: uploadId as string,
          fileName: upload?.metadata?.fileName,
        },
      });
    },
    value: !!upload?.movedAt,
    children: [
      {
        name: "Extracting video thumbnails",
        toggled: true,
        value: video?.thumbnails?.length! > 0,
        onClick() {
          enqueue({
            name: "extract-thumbnails",
            payload: {
              uploadId: uploadId as string,
              fileName: upload?.metadata?.fileName,
            },
          });
        },
        children: [
          {
            name: "Analyzing video content",
            toggled: true,
            value: !!video?.analyzedAt,
            onClick() {
              enqueue({
                name: "analyze-video",
                payload: {
                  uploadId: uploadId as string,
                  fileName: upload?.metadata?.fileName,
                },
              });
            },
          },
        ],
      },
      {
        name: "Transcoding video to hls",
        toggled: true,
        value: upload?.transcodedAt,
        onClick() {
          enqueue({
            name: "transcode-video",
            payload: {
              uploadId: uploadId as string,
              fileName: upload?.metadata?.fileName,
            },
          });
        },
      },
      {
        name: "Creating a video thumbnail",
        toggled: true,
        value: !!video?.thumbnailUrl,
        onClick() {
          enqueue({
            name: "generate-thumbnail",
            payload: {
              uploadId: uploadId as string,
              fileName: upload?.metadata?.fileName,
            },
          });
        },
      },

      {
        name: "Creating a video preview",
        toggled: true,
        value: !!video?.previewUrl,
        onClick() {
          enqueue({
            name: "generate-preview",
            payload: {
              uploadId: uploadId as string,
              fileName: upload?.metadata?.fileName,
            },
          });
        },
      },
    ],
  };

  const isDone =
    upload?.transcodedAt ||
    flattenTree(treeData).every(({ value }) => value) ||
    jobs?.every((job) => ({
      completed: !!job.finishedOn,
    }));

  return (
    <div className="container mx-auto max-w-2xl bg-gray-600 p-8">
      {!upload?.transcodedAt && !video?.analyzedAt && (
        <p className="mb-4 text-sm font-bold text-white">
          Please hold, your upload is being processed...
        </p>
      )}
      <h1 className="mb-4 text-lg text-white">{video?.title}</h1>
      <p className="mb-4 text-lg text-white">{video?.description}</p>
      <p className="mb-4 text-lg text-white">
        Upload ID:
        <code className="mb-4 pl-2 text-gray-300">{uploadId}</code>
      </p>
      <div className="mb-4">
        {isDone && video?.thumbnailUrl && (
          <Image
            src={video?.thumbnailUrl}
            width={640}
            height={360}
            alt={video?.description!}
          />
        )}
      </div>
      <div className="mb-4 flex w-full justify-between">
        {isDone ? (
          <Link
            href={`/watch/${video?.id}`}
            className="text-white underline hover:text-gray-300"
          >
            Watch here
          </Link>
        ) : (
          <Spinner />
        )}
        {isDone && isSignedIn && author?.id === userId && (
          <Link
            href={`/channel/${author?.username}/video/${video?.id}`}
            className="text-white underline hover:text-gray-300"
          >
            Edit here
          </Link>
        )}
      </div>
      <Treebeard
        data={treeData}
        decorators={{ ...Treebeard.decorators, Container: StatusIconContainer }}
        onToggle={(
          node: { onClick: () => void; children: any; toggled: any },
          toggled: any
        ) => {
          if (node.onClick) {
            node.onClick();
          }
          if (node.children) {
            node.toggled = toggled;
          }
        }}
      />

      {results?.length > 0 && (
        <div className="mt-4 bg-black p-2">
          <h3 className="p-2 pt-0 text-gray-50">Jobs</h3>
          <ul>
            {results
              ?.filter((result) => result)
              .map((result) => (
                <li
                  key={result!.id}
                  className="flex w-full flex-row justify-between border-t border-dashed border-gray-200 p-2 text-white"
                >
                  <h2>{result!.name}</h2>
                  {result!.finishedOn ? (
                    <p className="text-gray-50">
                      {DateTime.fromMillis(result!.finishedOn).toRelative()}
                    </p>
                  ) : (
                    <Spinner className="h-4 w-4" />
                  )}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

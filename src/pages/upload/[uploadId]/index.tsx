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

  const statusIcons = [
    {
      label: "Segments",
      value: segments.length > 0,
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
      label: "Thumbnail",
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
      label: "Preview",
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
    {
      label: "Analyzed",
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
  ];

  const isDone =
    !video?.upload?.transcoded ||
    statusIcons.every(({ value }) => value) ||
    jobs?.every((job) => ({
      completed: !!job.finishedOn,
    }));

  return (
    <div className="container mx-auto max-w-2xl bg-gray-600 p-8">
      <h1 className="mb-4 text-xl text-white">{video?.title}</h1>
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
      <ul>
        {statusIcons.map(({ label, value, onClick }) => (
          <li
            key={label}
            className="flex cursor-pointer items-center justify-center border-b-0 border-dashed border-gray-400 bg-gray-900 p-4 shadow"
            onClick={onClick}
          >
            <span
              className={`h-6 w-6 ${value ? "text-green-500" : "text-red-500"}`}
            >
              {value ? <CheckIcon /> : <XMarkIcon />}
            </span>
            <span className="ml-2 font-medium text-white">{label}</span>
          </li>
        ))}
      </ul>
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

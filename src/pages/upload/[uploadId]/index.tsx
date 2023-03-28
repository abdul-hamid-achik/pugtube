import Spinner from "@/components/spinner";
import { api } from "@/utils/api";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Page() {
  const {
    query: { uploadId },
  } = useRouter();
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

  const { data: { id: jobId } = {}, mutate: enqueue } =
    api.jobs.enqueue.useMutation();

  const { data: job } = api.jobs.job.useQuery(jobId as string, {
    enabled: !!jobId,
    refetchInterval: 2_000,
  });

  const statusIcons = [
    {
      label: "Transcoded",
      value: upload?.transcoded,
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
      label: "Segments",
      value: segments.length > 0,
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
  ];

  const isDone =
    statusIcons.every(({ value }) => value) || (job && job.finishedOn);

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
      <div className="mb-4">
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
      </div>
      <ul className="grid grid-cols-3 gap-4">
        {statusIcons.map(({ label, value, onClick }) => (
          <li
            key={label}
            className={`${
              onClick ? "cursor-pointer" : ""
            } flex items-center justify-center rounded-lg bg-gray-500 p-4 shadow`}
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
    </div>
  );
}

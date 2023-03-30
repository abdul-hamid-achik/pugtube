import Spinner from "@/components/spinner";
import { prisma } from "@/server/db";
import { api } from "@/utils/api";
import { getSignedUrl } from "@/utils/s3";
import { User } from "@clerk/nextjs/api";
import { clerkClient, getAuth } from "@clerk/nextjs/server";
import {
  DocumentArrowUpIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { Upload, Video, VideoMetadata } from "@prisma/client";
import { GetServerSideProps } from "next";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { ChangeEvent, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

interface PageProps {
  user: User;
  video:
    | (Video & { upload: Upload & { metadata: VideoMetadata | null } })
    | null;
}

type Inputs = {
  title: string;
  description: string;
  thumbnailUrl: string;
  category: string;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { userId } = getAuth(context?.req);
  const { username, videoId } = context.query;
  const [user] = await clerkClient.users.getUserList({
    username: [username as string],
  });

  const video = await prisma.video.findUniqueOrThrow({
    where: {
      id: videoId as string,
    },
    include: {
      upload: {
        include: {
          metadata: true,
        },
      },
    },
  });

  if (!user || !video || user?.id !== userId) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      user: {
        username: user.username,
      },
      video: {
        ...video,
        upload: {
          ...video.upload,
          creationDate: video.upload.creationDate!.toISOString(),
        },
        analyzedAt: video.analyzedAt?.toISOString(),
        createdAt: video.createdAt.toISOString(),
        thumbnailUrl: video.thumbnailUrl
          ? await getSignedUrl(video.thumbnailUrl)
          : null,
        previewUrl: video.previewUrl
          ? await getSignedUrl(video.previewUrl)
          : null,
      },
    },
  };
};

function Page(props: PageProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<Inputs>({
    defaultValues: {
      title: props.video!.title,
      description: props.video!.description || "",
      thumbnailUrl: props.video!.thumbnailUrl || "",
      category: props.video!.category || "",
    },
  });
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    props.video!.thumbnailUrl
  );
  const { mutate, isLoading, error, isError } = api.videos.update.useMutation({
    onSuccess: (_data) => {
      router.reload();
    },
  });
  const { mutate: deleteVideo } = api.videos.delete.useMutation();

  const { mutate: enqueue } = api.background.enqueue.useMutation({});

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    let { thumbnailUrl } = data;

    const response = await fetch(`/api/video/${props.video!.id}/thumbnail`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": (thumbnailUrl as unknown as File).type,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get presigned URL");
    }

    const { url: presignedPutUrl } = await response.json();

    await fetch(presignedPutUrl, {
      method: "PUT",
      body: thumbnailUrl as unknown as File,
      headers: new Headers({
        "Content-Type": (thumbnailUrl as unknown as File).type,
      }),
    });

    thumbnailUrl = `thumbnails/${props.video!.id}.png`;

    mutate({
      ...data,
      id: props.video!.id,
      thumbnailUrl: thumbnailUrl as string,
    });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setValue("thumbnailUrl", file as unknown as string);
  };

  const handleDelete = async () => {
    await deleteVideo(props.video!.id);
    await router.push(`/channel/${props.user.username}`);
  };

  const handleTranscode = async () => {
    await enqueue({
      name: "transcode",
      payload: {
        uploadId: props.video!.uploadId,
        fileName: props.video!.upload!.metadata!.fileName,
      },
    });
  };

  return (
    <div className="md:grid md:grid-cols-3 md:gap-6">
      <div className="md:col-span-1">
        <div className="px-4 sm:px-0">
          <Link
            href={`/channel/${props.user.username}`}
            className="text-sm font-semibold leading-6 text-gray-300 underline hover:text-gray-200"
          >
            Go back to channel
          </Link>
          <h3 className="text-base font-semibold leading-6 text-white">
            Video: {props.video!.id}
          </h3>
          <p className="mt-1 text-sm text-white">
            This information will be displayed publicly so be careful what you
            share.
          </p>
          <div className="mt-5 flex flex-col">
            <Link
              className="text-sm font-semibold leading-6 text-gray-300 underline hover:text-gray-200"
              href={`/upload/${props?.video?.uploadId}`}
            >
              View Upload
            </Link>
            <Link
              href={`/watch/${props.video!.id}`}
              className="text-sm font-semibold leading-6 text-gray-300 underline hover:text-gray-200"
            >
              View Video
            </Link>
            <button
              type="button"
              onClick={handleTranscode}
              className="text-sm font-semibold leading-6 text-blue-500 underline hover:text-blue-400"
            >
              Transcode Video
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="text-sm font-semibold leading-6 text-red-500 underline hover:text-red-400"
            >
              Delete Video
            </button>
          </div>
        </div>
      </div>
      <div className="mt-5 md:col-span-2 md:mt-0">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="shadow sm:overflow-hidden sm:rounded-md">
            <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
              {isError && error && (
                <div className="mb-4 rounded-md bg-red-500 px-6 py-4 text-white">
                  <div className="flex">
                    <div className="shrink-0">
                      <ExclamationCircleIcon className="h-5 w-5" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-semibold">
                        An error occurred:
                      </h3>
                      <div className="mt-2 text-sm">
                        <p>{error.message}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid">
                <div className="col-span-3 sm:col-span-2">
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Title
                  </label>
                  <div className="mt-2 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      id="title"
                      className="block w-full flex-1 rounded border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      {...register("title", { required: true })}
                    />
                  </div>
                  {errors.title && (
                    <p className="text-red-500">This field is required</p>
                  )}
                  {errors.title?.type === "maxLength" && (
                    <p className="text-red-500">Max length exceeded</p>
                  )}
                  {errors.title?.type === "minLength" && (
                    <p className="text-red-500">Min length not met</p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Description
                </label>
                <div className="mt-2">
                  <textarea
                    id="description"
                    rows={3}
                    className="mt-1 block w-full rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:py-1.5 sm:text-sm sm:leading-6"
                    {...register("description")}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  This description will be shown on the video page.
                </p>
              </div>
              <div>
                <div className="block text-sm font-medium leading-6 text-gray-900">
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Category
                  </label>
                  <div className="mt-2 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      id="category"
                      className="block w-full flex-1 rounded border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      {...register("category")}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="thumbnail"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Thumbnail
                </label>
                <div className="mt-2 flex h-full justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
                  <div className="space-y-1 text-center">
                    {props.video!.thumbnailUrl || thumbnailPreview ? (
                      <Image
                        src={
                          props.video!.thumbnailUrl ||
                          (thumbnailPreview as string)
                        }
                        alt={props.video!.title}
                        width={480}
                        height={480}
                        className="w-full"
                      />
                    ) : (
                      <>
                        <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                      </>
                    )}
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="thumbnailUrl"
                        className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500"
                      >
                        <span>Upload a thumbnail</span>
                        <input
                          id="thumbnailUrl"
                          type="file"
                          className="sr-only"
                          accept="image/png, image/jpeg, image/gif"
                          {...register("thumbnailUrl")}
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center rounded-md bg-indigo-600 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                {isLoading ? <Spinner className="ml-2" /> : "Send"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Page;

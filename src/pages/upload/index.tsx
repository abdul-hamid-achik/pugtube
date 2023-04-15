import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";

import { api } from "@/utils/api";
import { useAuth } from "@clerk/nextjs";
import AwsS3Multipart from "@uppy/aws-s3-multipart";
import Uppy, { UppyFile } from "@uppy/core";
import { Dashboard } from "@uppy/react";
import { GetServerSidePropsContext } from "next";
import Link from "next/link";
import React from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";

interface FormData {
  title: string;
  description: string;
  category: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return {
    props: {},
  };
}

export default function Upload() {
  const { getToken } = useAuth();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>();
  const { mutate } = api.videos.create.useMutation({
    onSuccess: async (video) => {
      uppy.resetProgress();
      alert("Video uploaded successfully");
      await router.push(`/upload/${video.uploadId}`);
    },
  });

  const uppy = React.useMemo(
    () =>
      new Uppy().use(AwsS3Multipart, {
        id: "uppy-s3-multipart",
        companionUrl: "/api",
        createMultipartUpload(file) {
          return getToken().then((token) =>
            fetch("/api/upload", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              credentials: "include",
              body: JSON.stringify({
                filename: file.name,
                filetype: file.type,
                type: file.type,
                contentType: file.type,
                size: file.size,
                operation: "createMultipartUpload",
              }),
            })
              .then((res) => res.json())
              .then((data) => {
                return { uploadId: data.uploadId, key: data.key };
              })
          );
        },
        signPart(file, partData) {
          return getToken().then((token) =>
            fetch("/api/upload", {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                ...partData,
                operation: "prepareUploadPart",
              }),
            })
              .then((res) => res.json())
              .then((data) => {
                return { url: data.url };
              })
          );
        },
        completeMultipartUpload(file, data) {
          return getToken().then((token) =>
            fetch("/api/upload", {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                key: data.key,
                uploadId: data.uploadId,
                parts: data.parts,
                size: file.size,
                filename: file.name,
                contentType: file.type,
                operation: "completeMultipartUpload",
              }),
            })
              .then((res) => res.json())
              .then((data) => {
                return { location: data.location };
              })
          );
        },
      }),
    []
  );

  const onSubmit = async (data: FormData) => {
    const { successful } = await uppy.upload();
    const file = successful.pop();
    const uploadId = (file as UppyFile & { uploadURL?: string })?.uploadURL
      ?.split("/")
      .pop();

    if (!uploadId) {
      setError("title", { message: "could not parse upload Id" });
      return;
    }

    mutate(
      {
        ...data,
        upload: { id: uploadId },
        duration: 0,
      },
      {
        onError: (error) => {
          setError("title", { message: error.message });
        },
      }
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full justify-center align-middle"
    >
      <div className="mb-8 flex w-full flex-col justify-between lg:max-w-3xl">
        <div className="flex w-full flex-col md:px-4 lg:px-8">
          <div className="mb-6">
            <label
              htmlFor="title"
              className="mb-2 block font-medium text-gray-50"
            >
              Title
            </label>
            {errors.title && (
              <p className="text-xs italic text-red-500">
                {errors.title.message}
              </p>
            )}
            <input
              {...register("title", { required: true })}
              className="w-full border border-x-0 border-t-0 bg-gray-700 px-3 py-2 leading-tight text-gray-50 focus:outline-none"
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="description"
              className="mb-2 block font-medium text-gray-50"
            >
              Description
            </label>
            {errors.description && (
              <p className="text-xs italic text-red-500">
                {errors.description.message}
              </p>
            )}
            <textarea
              {...register("description", { required: true })}
              className="w-full border border-x-0 border-t-0 border-gray-50 bg-gray-700 px-3 py-2 leading-tight text-gray-50 focus:outline-none"
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="category"
              className="mb-2 block font-medium text-gray-50"
            >
              Category
            </label>
            {errors.category && (
              <p className="text-xs italic text-red-500">
                {errors.category.message}
              </p>
            )}
            <input
              {...register("category", { required: true })}
              className="w-full border border-x-0 border-t-0 border-gray-50 bg-gray-700 px-3 py-2 leading-tight text-gray-50 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex flex-col sm:px-2 md:px-4 lg:px-8">
          <div className="mb-6 flex w-full justify-center">
            <Dashboard
              id="upload"
              uppy={uppy}
              plugins={["Tus", "AwsS3Multipart"]}
              width="100%"
              className="w-full"
              hideUploadButton
            />
          </div>
        </div>
        <div className="xs:w-full md:mx-auto">
          <button
            type="submit"
            className={`rounded ${
              errors.title || errors.category || errors.description
                ? "bg-red-500"
                : "bg-gray-50"
            } w-full px-4 py-2 text-black focus:outline-none md:w-60`}
          >
            Upload
          </button>
        </div>
        <div className="mx-auto mt-6 flex flex-col justify-between align-bottom">
          <p className="self-end text-xs text-gray-200">
            By uploading, you agree to our&nbsp;
            <Link href="/terms-of-service" className="text-blue-400">
              Terms of Service
            </Link>
            &nbsp;and&nbsp;
            <Link href="/privacy-policy" className="text-blue-400">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </form>
  );
}

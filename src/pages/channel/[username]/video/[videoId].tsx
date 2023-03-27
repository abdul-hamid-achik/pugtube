import Spinner from '@/components/spinner';
import { prisma } from '@/server/db';
import { api } from '@/utils/api';
import { getSignedUrl } from '@/utils/s3';
import { User } from '@clerk/nextjs/api';
import { clerkClient, getAuth } from '@clerk/nextjs/server';
import { DocumentArrowUpIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { Upload, Video, VideoMetadata } from "@prisma/client";
import { GetServerSideProps } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ChangeEvent, useState } from 'react';
import { SubmitHandler, useForm } from "react-hook-form";

interface PageProps {
    user: User;
    video:  (Video & {upload: Upload & {metadata: VideoMetadata | null}}) | null;
}

type Inputs = {
    title: string,
    description: string,
    thumbnailUrl: string,
    category: string,
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { userId } = getAuth(context?.req);
    const { username, videoId } = context.query;
    const [user] = await clerkClient.users.getUserList({
        username: [username as string],
    });

    const video = await prisma.video.findUnique({
        where: {
            id: videoId as string,
        },
        include: {
            upload: {
                include: {
                    metadata: true,
                }
            },
        }
    });

    if (!user || !video || user?.id !== userId) {
        return {
            notFound: true,
        };
    }


    return {
        props: {
            user: JSON.parse(JSON.stringify(user)),
            video: JSON.parse(JSON.stringify({
                ...video,
                thumbnailUrl: video.thumbnailUrl ? await getSignedUrl(video.thumbnailUrl) : null,
            })),
        },
    };
}


function Page(props: PageProps) {
    const router = useRouter();
    const { register, handleSubmit, formState: { errors }, setValue } = useForm<Inputs>({
        defaultValues: {
            title: props.video!.title,
            description: props.video!.description || "",
            thumbnailUrl: props.video!.thumbnailUrl || "",
            category: props.video!.category || "",
        }
    });
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(props.video!.thumbnailUrl);
    const { mutate, isLoading, error, isError } = api.videos.update.useMutation({
        onSuccess: (_data) => {
            router.reload();
        },
    })
    const { mutate: deleteVideo } = api.videos.delete.useMutation()

    const { mutate: enqueue } = api.jobs.enqueue.useMutation({ })

    const onSubmit: SubmitHandler<Inputs> = async data => {
        let { thumbnailUrl } = data;
        try {
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
                body: (thumbnailUrl as unknown as File),
                headers: new Headers({
                    "Content-Type": (thumbnailUrl as unknown as File).type,
                }),
            });

            thumbnailUrl = `thumbnails/${props.video!.id}.png`;
        } catch (error) {
            console.error("Error uploading thumbnail:", error);
            return;
        }
        mutate({ ...data, id: props.video!.id, thumbnailUrl: thumbnailUrl as string });
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
    }

    const handleTranscode = async () => {
        await enqueue({
            name: "transcode",
            payload: {
                uploadId: props.video!.uploadId,
                fileName: props.video!.upload!.metadata!.fileName
            }
        });
    }

    return (
        <div className="flex h-screen flex-col justify-center bg-gray-900 p-4 align-middle"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='192' height='192' viewBox='0 0 192 192'%3E%3Cpath fill='%239C92AC' fill-opacity='0.4' d='M192 15v2a11 11 0 0 0-11 11c0 1.94 1.16 4.75 2.53 6.11l2.36 2.36a6.93 6.93 0 0 1 1.22 7.56l-.43.84a8.08 8.08 0 0 1-6.66 4.13H145v35.02a6.1 6.1 0 0 0 3.03 4.87l.84.43c1.58.79 4 .4 5.24-.85l2.36-2.36a12.04 12.04 0 0 1 7.51-3.11 13 13 0 1 1 .02 26 12 12 0 0 1-7.53-3.11l-2.36-2.36a4.93 4.93 0 0 0-5.24-.85l-.84.43a6.1 6.1 0 0 0-3.03 4.87V143h35.02a8.08 8.08 0 0 1 6.66 4.13l.43.84a6.91 6.91 0 0 1-1.22 7.56l-2.36 2.36A10.06 10.06 0 0 0 181 164a11 11 0 0 0 11 11v2a13 13 0 0 1-13-13 12 12 0 0 1 3.11-7.53l2.36-2.36a4.93 4.93 0 0 0 .85-5.24l-.43-.84a6.1 6.1 0 0 0-4.87-3.03H145v35.02a8.08 8.08 0 0 1-4.13 6.66l-.84.43a6.91 6.91 0 0 1-7.56-1.22l-2.36-2.36A10.06 10.06 0 0 0 124 181a11 11 0 0 0-11 11h-2a13 13 0 0 1 13-13c2.47 0 5.79 1.37 7.53 3.11l2.36 2.36a4.94 4.94 0 0 0 5.24.85l.84-.43a6.1 6.1 0 0 0 3.03-4.87V145h-35.02a8.08 8.08 0 0 1-6.66-4.13l-.43-.84a6.91 6.91 0 0 1 1.22-7.56l2.36-2.36A10.06 10.06 0 0 0 107 124a11 11 0 0 0-22 0c0 1.94 1.16 4.75 2.53 6.11l2.36 2.36a6.93 6.93 0 0 1 1.22 7.56l-.43.84a8.08 8.08 0 0 1-6.66 4.13H49v35.02a6.1 6.1 0 0 0 3.03 4.87l.84.43c1.58.79 4 .4 5.24-.85l2.36-2.36a12.04 12.04 0 0 1 7.51-3.11A13 13 0 0 1 81 192h-2a11 11 0 0 0-11-11c-1.94 0-4.75 1.16-6.11 2.53l-2.36 2.36a6.93 6.93 0 0 1-7.56 1.22l-.84-.43a8.08 8.08 0 0 1-4.13-6.66V145H11.98a6.1 6.1 0 0 0-4.87 3.03l-.43.84c-.79 1.58-.4 4 .85 5.24l2.36 2.36a12.04 12.04 0 0 1 3.11 7.51A13 13 0 0 1 0 177v-2a11 11 0 0 0 11-11c0-1.94-1.16-4.75-2.53-6.11l-2.36-2.36a6.93 6.93 0 0 1-1.22-7.56l.43-.84a8.08 8.08 0 0 1 6.66-4.13H47v-35.02a6.1 6.1 0 0 0-3.03-4.87l-.84-.43c-1.59-.8-4-.4-5.24.85l-2.36 2.36A12 12 0 0 1 28 109a13 13 0 1 1 0-26c2.47 0 5.79 1.37 7.53 3.11l2.36 2.36a4.94 4.94 0 0 0 5.24.85l.84-.43A6.1 6.1 0 0 0 47 84.02V49H11.98a8.08 8.08 0 0 1-6.66-4.13l-.43-.84a6.91 6.91 0 0 1 1.22-7.56l2.36-2.36A10.06 10.06 0 0 0 11 28 11 11 0 0 0 0 17v-2a13 13 0 0 1 13 13c0 2.47-1.37 5.79-3.11 7.53l-2.36 2.36a4.94 4.94 0 0 0-.85 5.24l.43.84A6.1 6.1 0 0 0 11.98 47H47V11.98a8.08 8.08 0 0 1 4.13-6.66l.84-.43a6.91 6.91 0 0 1 7.56 1.22l2.36 2.36A10.06 10.06 0 0 0 68 11 11 11 0 0 0 79 0h2a13 13 0 0 1-13 13 12 12 0 0 1-7.53-3.11l-2.36-2.36a4.93 4.93 0 0 0-5.24-.85l-.84.43A6.1 6.1 0 0 0 49 11.98V47h35.02a8.08 8.08 0 0 1 6.66 4.13l.43.84a6.91 6.91 0 0 1-1.22 7.56l-2.36 2.36A10.06 10.06 0 0 0 85 68a11 11 0 0 0 22 0c0-1.94-1.16-4.75-2.53-6.11l-2.36-2.36a6.93 6.93 0 0 1-1.22-7.56l.43-.84a8.08 8.08 0 0 1 6.66-4.13H143V11.98a6.1 6.1 0 0 0-3.03-4.87l-.84-.43c-1.59-.8-4-.4-5.24.85l-2.36 2.36A12 12 0 0 1 124 13a13 13 0 0 1-13-13h2a11 11 0 0 0 11 11c1.94 0 4.75-1.16 6.11-2.53l2.36-2.36a6.93 6.93 0 0 1 7.56-1.22l.84.43a8.08 8.08 0 0 1 4.13 6.66V47h35.02a6.1 6.1 0 0 0 4.87-3.03l.43-.84c.8-1.59.4-4-.85-5.24l-2.36-2.36A12 12 0 0 1 179 28a13 13 0 0 1 13-13zM84.02 143a6.1 6.1 0 0 0 4.87-3.03l.43-.84c.8-1.59.4-4-.85-5.24l-2.36-2.36A12 12 0 0 1 83 124a13 13 0 1 1 26 0c0 2.47-1.37 5.79-3.11 7.53l-2.36 2.36a4.94 4.94 0 0 0-.85 5.24l.43.84a6.1 6.1 0 0 0 4.87 3.03H143v-35.02a8.08 8.08 0 0 1 4.13-6.66l.84-.43a6.91 6.91 0 0 1 7.56 1.22l2.36 2.36A10.06 10.06 0 0 0 164 107a11 11 0 0 0 0-22c-1.94 0-4.75 1.16-6.11 2.53l-2.36 2.36a6.93 6.93 0 0 1-7.56 1.22l-.84-.43a8.08 8.08 0 0 1-4.13-6.66V49h-35.02a6.1 6.1 0 0 0-4.87 3.03l-.43.84c-.79 1.58-.4 4 .85 5.24l2.36 2.36a12.04 12.04 0 0 1 3.11 7.51A13 13 0 1 1 83 68a12 12 0 0 1 3.11-7.53l2.36-2.36a4.93 4.93 0 0 0 .85-5.24l-.43-.84A6.1 6.1 0 0 0 84.02 49H49v35.02a8.08 8.08 0 0 1-4.13 6.66l-.84.43a6.91 6.91 0 0 1-7.56-1.22l-2.36-2.36A10.06 10.06 0 0 0 28 85a11 11 0 0 0 0 22c1.94 0 4.75-1.16 6.11-2.53l2.36-2.36a6.93 6.93 0 0 1 7.56-1.22l.84.43a8.08 8.08 0 0 1 4.13 6.66V143h35.02z'%3E%3C/path%3E%3C/svg%3E")`
            }}
        >
            <div>
                <div className="md:grid md:grid-cols-3 md:gap-6">
                    <div className="md:col-span-1">
                        <div className="px-4 sm:px-0">
                            <Link href={`/channel/${props.user.username}`} className="text-sm font-semibold leading-6 text-gray-300 underline hover:text-gray-200">
                                Go back to channel
                            </Link>
                            <h3 className="text-base font-semibold leading-6 text-white">Video: {props.video!.id}</h3>
                            <p className="mt-1 text-sm text-white">
                                This information will be displayed publicly so be careful what you share.
                            </p>
                            <div className="mt-5 flex flex-col">
                                <Link className="text-sm font-semibold leading-6 text-gray-300 underline hover:text-gray-200" href={`/upload/${props?.video?.uploadId}/status`}>
                                    View Upload
                                </Link>
                                <Link href={`/watch/${props.video!.id}`} className="text-sm font-semibold leading-6 text-gray-300 underline hover:text-gray-200">
                                    View Video
                                </Link>
                                <button type="button" onClick={handleTranscode} className="text-sm font-semibold leading-6 text-blue-500 underline hover:text-blue-400">
                                    Transcode Video
                                </button>
                                <button type="button" onClick={handleDelete} className="text-sm font-semibold leading-6 text-red-500 underline hover:text-red-400">
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
                                            <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900">
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
                                            {errors.title && <p className="text-red-500">This field is required</p>}
                                            {errors.title?.type === "maxLength" && <p className="text-red-500">Max length exceeded</p>}
                                            {errors.title?.type === "minLength" && <p className="text-red-500">Min length not met</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
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
                                            <label htmlFor="category" className="block text-sm font-medium leading-6 text-gray-900">
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
                                        <label htmlFor="thumbnail" className="block text-sm font-medium leading-6 text-gray-900">Thumbnail</label>
                                        <div className="mt-2 flex h-full justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
                                            <div className="space-y-1 text-center">
                                                {props.video!.thumbnailUrl || thumbnailPreview ? <Image
                                                    src={props.video!.thumbnailUrl || thumbnailPreview as string}
                                                    alt={props.video!.title} width={480} height={480} className="w-full" />
                                                    : <>
                                                        <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                                                    </>}
                                                <div className="flex text-sm text-gray-600">
                                                    <label
                                                        htmlFor="thumbnailUrl"
                                                        className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500"
                                                    >
                                                        <span>Upload a thumbnail</span>
                                                        <input id="thumbnailUrl" type="file" className="sr-only"
                                                            accept="image/png, image/jpeg, image/gif"
                                                            {...register('thumbnailUrl')}
                                                            onChange={handleFileChange} />
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
                                        {isLoading ? <Spinner className="ml-2" /> : 'Send'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}


export default Page

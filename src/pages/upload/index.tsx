import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';

import { api } from '@/utils/api';
import { useAuth } from '@clerk/nextjs';
import { Popover, Switch } from '@headlessui/react';
import AwsS3Multipart from '@uppy/aws-s3-multipart';
import Uppy, { UppyFile } from '@uppy/core';
import { Dashboard } from '@uppy/react';
import Tus from '@uppy/tus';
import { GetServerSidePropsContext } from 'next';
import Link from 'next/link';
import router from 'next/router';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
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
    const [isResumable, setIsResumable] = useState(false);

    const uppy = React.useMemo(() => {
        const uppyInstance = new Uppy();

        if (isResumable) {
            uppyInstance.use(Tus, {
                id: 'uppy-tus',
                endpoint: '/api/upload',
                retryDelays: [0, 1000, 3000, 5000],
                chunkSize: 10_485_760, // 10 MB
            });
        } else {
            uppyInstance.use(AwsS3Multipart, {
                id: 'uppy-s3-multipart',
                companionUrl: '/api',
                createMultipartUpload(file) {
                    return fetch('/api/get-signed-url', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                            filename: file.name,
                            filetype: file.type,
                            type: file.type,
                            contentType: file.type,
                            size: file.size,
                            operation: 'createMultipartUpload',
                        }),
                    })
                        .then((res) => res.json())
                        .then((data) => {
                            return { uploadId: data.uploadId, key: data.key };
                        });
                },
                signPart(file, partData) {
                    return fetch('/api/get-signed-url', {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            ...partData,
                            operation: 'prepareUploadPart',
                        }),
                    })
                        .then((res) => res.json())
                        .then((data) => {
                            return { url: data.url };
                        });
                },
                completeMultipartUpload(file, data) {
                    return fetch('/api/get-signed-url', {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            key: data.key,
                            uploadId: data.uploadId,
                            parts: data.parts,
                            size: file.size,
                            filename: file.name,
                            contentType: file.type,
                            operation: 'completeMultipartUpload',
                        }),
                    })
                        .then((res) => res.json())
                        .then((data) => {
                            return { location: data.location };
                        });
                },
            });
        }
        return uppyInstance;
    }, [isResumable]);

    const { userId } = useAuth();
    const { register, handleSubmit, setError, formState: { errors } } = useForm<FormData>();
    const { mutate } = api.video.create.useMutation({
        onSuccess: async (video) => {
            uppy.resetProgress();
            await router.push(`/upload/status?uploadId=${video.uploadId}`);
        },
    });

    const onSubmit = async (data: FormData) => {
        const { successful, failed } = await uppy.upload();
        const file = successful.pop();
        const uploadId = (file as UppyFile & { uploadURL?: string })?.uploadURL?.split('/').pop();

        if (!uploadId) {
            setError('title', { message: 'could not parse upload Id' });
            return;
        }

        mutate({
            ...data,
            upload: { id: uploadId },
            duration: 0,
        }, {
            onError: (error) => {
                setError('title', { message: error.message });
            }
        });
    };

    return (
        <div className="h-full bg-gray-900">
            <div className="mx-auto h-full max-w-full px-6 py-8">
                <Link href="/" className="mb-4 text-2xl font-medium text-white">
                    Back to home
                </Link>
                <form onSubmit={handleSubmit(onSubmit)} className="flex justify-center p-4 align-middle">
                    <div className="mb-8 flex max-w-screen-md flex-col justify-between rounded-lg bg-white p-6 shadow">
                        <div className="flex w-full flex-col px-8">
                            <div className="mb-6">
                                <label htmlFor="title" className="mb-2 block font-medium text-gray-700">Title</label>
                                {errors.title && <p className="text-xs italic text-red-500">{errors.title.message}</p>}
                                <input {...register('title', { required: true })} className=" w-full rounded-lg border py-2 px-3 leading-tight text-gray-700 focus:outline-none" />
                            </div>
                            <div className="mb-6">
                                <label htmlFor="description" className="mb-2 block font-medium text-gray-700">Description</label>
                                {errors.description && <p className="text-xs italic text-red-500">{errors.description.message}</p>}
                                <textarea {...register('description', { required: true })} className=" w-full rounded-lg border py-2 px-3 leading-tight text-gray-700 focus:outline-none" />
                            </div>
                            <div className="mb-6">
                                <label htmlFor="category" className="mb-2 block font-medium text-gray-700">Category</label>
                                {errors.category && <p className="text-xs italic text-red-500">{errors.category.message}</p>}
                                <input {...register('category', { required: true })} className=" w-full rounded-lg border py-2 px-3 leading-tight text-gray-700 focus:outline-none" />
                            </div>
                            <div className="mb-6 flex flex-col justify-between align-bottom">
                                <p className="self-end text-sm">
                                    By uploading, you agree to our&nbsp;
                                    <Link href="/terms-of-service" className="text-blue-600">
                                        Terms of Service
                                    </Link>
                                    &nbsp;and&nbsp;
                                    <Link href="/privacy-policy" className="text-blue-600">
                                        Privacy Policy
                                    </Link>
                                </p>
                            </div>

                        </div>
                        <div className="flex flex-col px-4">
                            <div className="mb-4">
                                <div className="flex items-center justify-between">
                                    <Popover className="relative inline-block">
                                        <Popover.Button>
                                            <span className="cursor-pointer text-gray-600">Resumable Uploads</span>
                                        </Popover.Button>
                                        <Popover.Panel className="absolute z-10 mt-1 rounded-md bg-gray-800 p-2 text-sm text-gray-700 shadow-md">
                                            Resumable uploads may not work at the moment, but you can try them if you want.
                                        </Popover.Panel>
                                    </Popover>

                                    <Switch
                                        checked={isResumable}
                                        onChange={setIsResumable}
                                        className={`${isResumable ? 'bg-blue-600' : 'bg-gray-200'
                                            } relative inline-flex h-6 w-11 items-center rounded-full`}
                                    >
                                        <span
                                            className={`${isResumable ? 'translate-x-6' : 'translate-x-1'
                                                } inline-block h-4 w-4 rounded-full bg-white`}
                                        />
                                    </Switch>
                                </div>
                            </div>

                            <div className="mb-6 flex justify-center">
                                {/* @ts-ignore */}
                                <Dashboard id="upload" uppy={uppy} plugins={['Tus', 'AwsS3Multipart']} hideUploadButton showAddFilesPanel={false} />
                            </div>
                        </div>

                        <div className="ml-4">
                            <button type="submit" className={
                                `rounded ${errors.title || errors.category || errors.description ? 'bg-red-500' : 'bg-gray-700'
                                } py-2 px-4 font-bold text-white ${errors.title || errors.category || errors.description ?
                                    'bg-red-500' : 'hover:bg-gray-500'
                                } focus:outline-none`}>Upload</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

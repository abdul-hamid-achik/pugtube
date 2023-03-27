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
    const { getToken } = useAuth();
    const { register, handleSubmit, setError, formState: { errors } } = useForm<FormData>();
    const { mutate } = api.videos.create.useMutation({
        onSuccess: async (video) => {
            uppy.resetProgress();
            await router.push(`/upload/${video.uploadId}`);
        },
    });

    const uppy = React.useMemo(() => {
        const uppyInstance = new Uppy();
        if (isResumable) {
            uppyInstance.use(Tus, {
                id: 'uppy-tus',
                endpoint: '/api/upload',
                retryDelays: [0, 1000, 3000, 5000],
                chunkSize: 10_485_760, // 10 MB
                onBeforeRequest: async (req, _file) => {
                    const token = await getToken();
                    req.setHeader('Authorization', `Bearer ${token}`);
                }
            });
        } else {
            uppyInstance.use(AwsS3Multipart, {
                id: 'uppy-s3-multipart',
                companionUrl: '/api',
                createMultipartUpload(file) {
                    return getToken().then(token => fetch('/api/get-signed-url', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            "Authorization": `Bearer ${token}`
                        },
                        credentials: "include",
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
                        }));
                },
                signPart(file, partData) {
                    return getToken().then(token => fetch('/api/get-signed-url', {
                        method: 'POST',
                        credentials: "include",
                        headers: {
                            'Content-Type': 'application/json',
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            ...partData,
                            operation: 'prepareUploadPart',
                        }),
                    })
                        .then((res) => res.json())
                        .then((data) => {
                            return { url: data.url };
                        }));
                },
                completeMultipartUpload(file, data) {
                    return getToken().then(token => fetch('/api/get-signed-url', {
                        method: 'POST',
                        credentials: "include",
                        headers: {
                            'Content-Type': 'application/json',
                            "Authorization": `Bearer ${token}`
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
                        }));
                },
            });
        }
        return uppyInstance;
    }, [isResumable, getToken]);


    const onSubmit = async (data: FormData) => {
        const { successful } = await uppy.upload();
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
        <div className="h-full bg-gray-900"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='192' height='192' viewBox='0 0 192 192'%3E%3Cpath fill='%239C92AC' fill-opacity='0.4' d='M192 15v2a11 11 0 0 0-11 11c0 1.94 1.16 4.75 2.53 6.11l2.36 2.36a6.93 6.93 0 0 1 1.22 7.56l-.43.84a8.08 8.08 0 0 1-6.66 4.13H145v35.02a6.1 6.1 0 0 0 3.03 4.87l.84.43c1.58.79 4 .4 5.24-.85l2.36-2.36a12.04 12.04 0 0 1 7.51-3.11 13 13 0 1 1 .02 26 12 12 0 0 1-7.53-3.11l-2.36-2.36a4.93 4.93 0 0 0-5.24-.85l-.84.43a6.1 6.1 0 0 0-3.03 4.87V143h35.02a8.08 8.08 0 0 1 6.66 4.13l.43.84a6.91 6.91 0 0 1-1.22 7.56l-2.36 2.36A10.06 10.06 0 0 0 181 164a11 11 0 0 0 11 11v2a13 13 0 0 1-13-13 12 12 0 0 1 3.11-7.53l2.36-2.36a4.93 4.93 0 0 0 .85-5.24l-.43-.84a6.1 6.1 0 0 0-4.87-3.03H145v35.02a8.08 8.08 0 0 1-4.13 6.66l-.84.43a6.91 6.91 0 0 1-7.56-1.22l-2.36-2.36A10.06 10.06 0 0 0 124 181a11 11 0 0 0-11 11h-2a13 13 0 0 1 13-13c2.47 0 5.79 1.37 7.53 3.11l2.36 2.36a4.94 4.94 0 0 0 5.24.85l.84-.43a6.1 6.1 0 0 0 3.03-4.87V145h-35.02a8.08 8.08 0 0 1-6.66-4.13l-.43-.84a6.91 6.91 0 0 1 1.22-7.56l2.36-2.36A10.06 10.06 0 0 0 107 124a11 11 0 0 0-22 0c0 1.94 1.16 4.75 2.53 6.11l2.36 2.36a6.93 6.93 0 0 1 1.22 7.56l-.43.84a8.08 8.08 0 0 1-6.66 4.13H49v35.02a6.1 6.1 0 0 0 3.03 4.87l.84.43c1.58.79 4 .4 5.24-.85l2.36-2.36a12.04 12.04 0 0 1 7.51-3.11A13 13 0 0 1 81 192h-2a11 11 0 0 0-11-11c-1.94 0-4.75 1.16-6.11 2.53l-2.36 2.36a6.93 6.93 0 0 1-7.56 1.22l-.84-.43a8.08 8.08 0 0 1-4.13-6.66V145H11.98a6.1 6.1 0 0 0-4.87 3.03l-.43.84c-.79 1.58-.4 4 .85 5.24l2.36 2.36a12.04 12.04 0 0 1 3.11 7.51A13 13 0 0 1 0 177v-2a11 11 0 0 0 11-11c0-1.94-1.16-4.75-2.53-6.11l-2.36-2.36a6.93 6.93 0 0 1-1.22-7.56l.43-.84a8.08 8.08 0 0 1 6.66-4.13H47v-35.02a6.1 6.1 0 0 0-3.03-4.87l-.84-.43c-1.59-.8-4-.4-5.24.85l-2.36 2.36A12 12 0 0 1 28 109a13 13 0 1 1 0-26c2.47 0 5.79 1.37 7.53 3.11l2.36 2.36a4.94 4.94 0 0 0 5.24.85l.84-.43A6.1 6.1 0 0 0 47 84.02V49H11.98a8.08 8.08 0 0 1-6.66-4.13l-.43-.84a6.91 6.91 0 0 1 1.22-7.56l2.36-2.36A10.06 10.06 0 0 0 11 28 11 11 0 0 0 0 17v-2a13 13 0 0 1 13 13c0 2.47-1.37 5.79-3.11 7.53l-2.36 2.36a4.94 4.94 0 0 0-.85 5.24l.43.84A6.1 6.1 0 0 0 11.98 47H47V11.98a8.08 8.08 0 0 1 4.13-6.66l.84-.43a6.91 6.91 0 0 1 7.56 1.22l2.36 2.36A10.06 10.06 0 0 0 68 11 11 11 0 0 0 79 0h2a13 13 0 0 1-13 13 12 12 0 0 1-7.53-3.11l-2.36-2.36a4.93 4.93 0 0 0-5.24-.85l-.84.43A6.1 6.1 0 0 0 49 11.98V47h35.02a8.08 8.08 0 0 1 6.66 4.13l.43.84a6.91 6.91 0 0 1-1.22 7.56l-2.36 2.36A10.06 10.06 0 0 0 85 68a11 11 0 0 0 22 0c0-1.94-1.16-4.75-2.53-6.11l-2.36-2.36a6.93 6.93 0 0 1-1.22-7.56l.43-.84a8.08 8.08 0 0 1 6.66-4.13H143V11.98a6.1 6.1 0 0 0-3.03-4.87l-.84-.43c-1.59-.8-4-.4-5.24.85l-2.36 2.36A12 12 0 0 1 124 13a13 13 0 0 1-13-13h2a11 11 0 0 0 11 11c1.94 0 4.75-1.16 6.11-2.53l2.36-2.36a6.93 6.93 0 0 1 7.56-1.22l.84.43a8.08 8.08 0 0 1 4.13 6.66V47h35.02a6.1 6.1 0 0 0 4.87-3.03l.43-.84c.8-1.59.4-4-.85-5.24l-2.36-2.36A12 12 0 0 1 179 28a13 13 0 0 1 13-13zM84.02 143a6.1 6.1 0 0 0 4.87-3.03l.43-.84c.8-1.59.4-4-.85-5.24l-2.36-2.36A12 12 0 0 1 83 124a13 13 0 1 1 26 0c0 2.47-1.37 5.79-3.11 7.53l-2.36 2.36a4.94 4.94 0 0 0-.85 5.24l.43.84a6.1 6.1 0 0 0 4.87 3.03H143v-35.02a8.08 8.08 0 0 1 4.13-6.66l.84-.43a6.91 6.91 0 0 1 7.56 1.22l2.36 2.36A10.06 10.06 0 0 0 164 107a11 11 0 0 0 0-22c-1.94 0-4.75 1.16-6.11 2.53l-2.36 2.36a6.93 6.93 0 0 1-7.56 1.22l-.84-.43a8.08 8.08 0 0 1-4.13-6.66V49h-35.02a6.1 6.1 0 0 0-4.87 3.03l-.43.84c-.79 1.58-.4 4 .85 5.24l2.36 2.36a12.04 12.04 0 0 1 3.11 7.51A13 13 0 1 1 83 68a12 12 0 0 1 3.11-7.53l2.36-2.36a4.93 4.93 0 0 0 .85-5.24l-.43-.84A6.1 6.1 0 0 0 84.02 49H49v35.02a8.08 8.08 0 0 1-4.13 6.66l-.84.43a6.91 6.91 0 0 1-7.56-1.22l-2.36-2.36A10.06 10.06 0 0 0 28 85a11 11 0 0 0 0 22c1.94 0 4.75-1.16 6.11-2.53l2.36-2.36a6.93 6.93 0 0 1 7.56-1.22l.84.43a8.08 8.08 0 0 1 4.13 6.66V143h35.02z'%3E%3C/path%3E%3C/svg%3E")`
            }}
        >
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

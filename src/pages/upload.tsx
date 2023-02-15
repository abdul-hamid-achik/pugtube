/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-misused-promises */
import "@uppy/core/dist/style.css"
import "@uppy/dashboard/dist/style.css"

import React from 'react';
import Uppy from '@uppy/core';
import { useForm } from 'react-hook-form';
import { Dashboard } from '@uppy/react';
import Tus from '@uppy/tus'
import { api } from "../utils/api";
import router from 'next/router';

interface FormData {
    title: string;
    description: string;
    category: string;
}

export default function UploadForm() {
    const { register, handleSubmit } = useForm<FormData>();
    const { mutate } = api.video.create.useMutation({
        onSuccess: async (video) => {
            uppy.resetProgress()
            await router.push(`/video/${video.id}`);
        },
    })

    // const {data: {id: uploadId}} = api.video.upload.useQuery()

    const uppy = React.useMemo(() => {
        return new Uppy().use(Tus, {
            id: 'uppy-tus',
            endpoint: '/api/upload',
            retryDelays: [0, 1000, 3000, 5000],
        })
    }, [])

    // React.useEffect(() => {
    //     return () => uppy.close({ reason: 'unmount' })
    // }, [uppy])

    const onSubmit = async (data: FormData) => {
        uppy.setMeta(data);
        await uppy.upload();
        const files = uppy.getFiles();

        if (files.length === 0) {
            return;
        }
        const file = files.pop()
        // @ts-ignore
        const uploadId: string = file.uploadURL.split('/').pop();

        // const url = files[0]?.meta.url as string;
        console.log(file, uploadId);
        mutate({
            ...data,
            originalUpload: { id: uploadId },
            duration: 0
        });
        console.log("UPLOADED")
    };


    return (
        <div className="bg-gray-100">
            <div className="max-w-screen-lg mx-auto px-6 py-8">
                <h1 className="text-2xl font-medium mb-4">Upload Video</h1>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="bg-white rounded-lg shadow p-6 mb-8">
                        <div className="mb-6">
                            <label htmlFor="title" className="block text-gray-700 font-medium mb-2">Title</label>
                            <input {...register('title', { required: true })} className="w-full border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="description" className="block text-gray-700 font-medium mb-2">Description</label>
                            <textarea {...register('description', { required: true })} className="w-full border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
                        </div>
                        <div className="mb-6">
                            <label htmlFor="category" className="block text-gray-700 font-medium mb-2">Category</label>
                            <input {...register('category', { required: true })} className="w-full border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>
                        <div className="mb-6 text-center">
                            <Dashboard id="upload" uppy={uppy} plugins={['Tus']} hideUploadButton />
                        </div>

                        <div>
                            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Upload</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

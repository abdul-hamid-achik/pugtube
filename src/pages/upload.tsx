import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';

import { api } from '@/utils/api';
import Uppy, { UppyFile } from '@uppy/core';
import { Dashboard } from '@uppy/react';
import Tus from '@uppy/tus';
import { useSession } from 'next-auth/react';
import router from 'next/router';
import React from 'react';
import { useForm } from 'react-hook-form';

interface FormData {
  title: string;
  description: string;
  category: string;
}

export default function UploadForm() {
  const uppy = React.useMemo(() => new Uppy().use(Tus, {
    id: 'uppy-tus',
    endpoint: '/api/upload',
    retryDelays: [0, 1000, 3000, 5000],
  }), []);

  const { data: session } = useSession();

  const { register, handleSubmit, setError } = useForm<FormData>();
  const { mutate } = api.video.create.useMutation({
    onSuccess: async (video) => {
      uppy.resetProgress();
      await router.push(
        session?.user?.id ?
          `/channel/${session.user.id}/watch/${video.id}` :
          `/watch/${video.id}`
      );
    },
  });

  const onSubmit = async (data: FormData) => {
    uppy.setMeta(data);
    const { successful, failed } = await uppy.upload();


    if (failed.length > 0) {
      setError('title', { message: 'Upload failed' });
      return;
    }

    if (successful.length === 0) {
      setError('title', { message: 'No file uploaded' });
      return;
    }

    const file = successful.pop();
    const uploadId = (file as UppyFile & { uploadURL?: string })?.uploadURL?.split('/').pop();

    if (!uploadId) {
      setError('title', { message: 'No file uploaded' });
      return;
    }

    mutate({
      ...data,
      originalUpload: { id: uploadId },
      duration: 0,
    });
  };

  return (
    <div className="bg-gray-100">
      <div className="mx-auto max-w-screen-lg px-6 py-8">
        <h1 className="mb-4 text-2xl font-medium">Upload Video</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-8 rounded-lg bg-white p-6 shadow">
            <div className="mb-6">
              <label htmlFor="title" className="mb-2 block font-medium text-gray-700">Title</label>
              <input {...register('title', { required: true })} className=" w-full rounded-lg border py-2 px-3 leading-tight text-gray-700 focus:outline-none" />
            </div>
            <div className="mb-6">
              <label htmlFor="description" className="mb-2 block font-medium text-gray-700">Description</label>
              <textarea {...register('description', { required: true })} className=" w-full rounded-lg border py-2 px-3 leading-tight text-gray-700 focus:outline-none" />
            </div>
            <div className="mb-6">
              <label htmlFor="category" className="mb-2 block font-medium text-gray-700">Category</label>
              <input {...register('category', { required: true })} className=" w-full rounded-lg border py-2 px-3 leading-tight text-gray-700 focus:outline-none" />
            </div>
            <div className="mb-6 text-center">
              <Dashboard id="upload" uppy={uppy} plugins={['Tus']} hideUploadButton />
            </div>

            <div>
              <button type="submit" className=" rounded bg-blue-500 py-2 px-4 font-bold text-white hover:bg-blue-700 focus:outline-none">Upload</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

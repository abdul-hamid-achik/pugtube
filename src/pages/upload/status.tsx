import Spinner from '@/components/spinner';
import { api } from '@/utils/api';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function ProcessingPage() {
    const { query: { uploadId } } = useRouter();
    const { data: upload } = api.upload.getById.useQuery(uploadId as string, {
        enabled: !!uploadId,
        refetchInterval: 3_000,
    });
    const { data: segments = [] } = api.playlist.getSegmentsByUploadId.useQuery(uploadId as string, {
        enabled: !!uploadId,
        refetchInterval: 3_000,
    });
    const { data: video } = api.video.getByUploadId.useQuery(uploadId as string, {
        enabled: !!uploadId,
        refetchInterval: 3_000,
    });

    const statusIcons = [
        { label: 'Transcoded', value: upload?.transcoded },
        { label: 'Segments', value: segments.length > 0 },
        { label: 'Thumbnail', value: !!video?.thumbnailUrl },
    ];

    const isDone = statusIcons.every(({ value }) => value);

    return (
        <div className="m-0 flex h-screen w-screen items-center justify-center bg-gray-700">
            <div className="container mx-auto max-w-xl pt-8">
                <h1 className="mb-4 text-xl text-white">{video?.title}</h1>
                <p className="mb-4 text-lg text-white">{video?.description}</p>
                <p className="mb-4 text-lg text-white">
                    Upload ID:
                    <code className="mb-4 pl-2 text-gray-300">{uploadId}</code>
                </p>
                <div className="mb-4">
                    {isDone ? <Link href={`/watch/${video?.id}`} className="text-white hover:text-gray-300">Watch here</Link> : <Spinner />}
                </div>
                <ul className="grid grid-cols-3 gap-4">
                    {statusIcons.map(({ label, value }) => (
                        <li key={label} className="flex items-center justify-center rounded-lg bg-gray-500 p-4 shadow">
                            <span className={`h-6 w-6 ${value ? 'text-green-500' : 'text-red-500'}`}>
                                {value ? <CheckIcon /> : <XMarkIcon />}
                            </span>
                            <span className="ml-2 font-medium text-white">{label}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

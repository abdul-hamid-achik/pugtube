import { api } from '@/utils/api';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
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

    return (
        <div className="container mx-auto my-8">
            <h1 className="mb-4 text-2xl font-bold">Processing Video</h1>
            <ul className="grid grid-cols-3 gap-4">
                {statusIcons.map(({ label, value }) => (
                    <li key={label} className="flex items-center justify-center rounded-lg bg-white p-4 shadow">
                        <span className={`h-6 w-6 ${value ? 'text-green-500' : 'text-red-500'}`}>
                            {value ? <CheckIcon /> : <XMarkIcon />}
                        </span>
                        <span className="ml-2 font-medium">{label}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

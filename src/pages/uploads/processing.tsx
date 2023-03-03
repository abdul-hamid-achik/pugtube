import { api } from '@/utils/api';
import { useRouter } from 'next/router';

import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Page() {
    const { query: { uploadId } } = useRouter();
    const { data: upload } = api.upload.getById.useQuery(uploadId as string, {
        refetchInterval: 1000,
    });
    const { data: segments = [] } = api.playlist.getSegmentsByUploadId.useQuery(uploadId as string, {
        refetchInterval: 1000,
    });

    const { data: video } = api.video.getByUploadId.useQuery(uploadId as string, {
        refetchInterval: 1000,
    });

    return (
        <div>
            <h1>Status</h1>
            <ul>
                <li>{upload?.transcoded ? <CheckIcon /> : <XMarkIcon />}</li>
                <li>{segments.length > 0 ? <CheckIcon /> : <XMarkIcon />}</li>
                <li>{!!video?.thumbnailUrl ? <CheckIcon /> : <XMarkIcon />}</li>
            </ul>
        </div>
    );
}
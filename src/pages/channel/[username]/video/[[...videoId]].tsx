import { useRouter } from 'next/router';

interface VideoPageProps {
    username: string;
    videoId: string;
}

const VideoPage = () => {
    const router = useRouter();
    const { username, videoId } = router.query;

    // Render the page with the user name and video ID
    return (
        <div>
            <h1>Channel: {username}</h1>
            <h2>Video: {videoId}</h2>
        </div>
    );
};

export default VideoPage;

import { useEffect, useRef } from "react";
import Hls from "hls.js";

interface VideoPlayerProps {
    src: string;
}

export default function VideoPlayer({ src }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(src);
            hls.attachMedia(videoRef.current);
        } else if (videoRef.current) {
            videoRef.current.src = src;
        }
    }, [src]);

    return (
        <video
            ref={videoRef}
            controls
            style={{ maxWidth: "100%" }}
        />
    );
}

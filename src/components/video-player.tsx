/* eslint-disable jsx-a11y/media-has-caption */
import Hls from "hls.js";
import { useEffect, useRef } from "react";
import log from "@/utils/logger";

interface VideoPlayerProps {
  src: string;
  poster: string;
}

export default function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (Hls.isSupported()) {
      const hls = new Hls({
        liveBackBufferLength: 0,
        debug: process.env.NODE_ENV === "development",
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play().catch((error) => log.error(error));
      });
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(src);
      });
      hls.attachMedia(videoRef.current!);
    } else {
      videoRef.current!.src = src;
    }
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      width="100%"
      height="480px"
      preload="metadata"
      style={{
        maxHeight: "480px",
        minWidth: "320px",
      }}
      className="w-full"
      controls
    />
  );
}

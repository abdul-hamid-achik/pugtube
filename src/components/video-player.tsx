/* eslint-disable jsx-a11y/media-has-caption */
import Hls from 'hls.js';
import { log } from 'next-axiom';
import { useEffect, useRef } from 'react';
interface VideoPlayerProps {
  src: string;
}

export default function VideoPlayer({ src }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && Hls.isSupported()) {
      const hls = new Hls({
        liveBackBufferLength: 0,
        debug: true
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play();
      });
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(src);
      });
      hls.attachMedia(videoRef.current);
    } else if (videoRef.current) {
      videoRef.current.src = src;
    }
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      style={{ maxWidth: '100%' }}
      controls
    />
  );
}

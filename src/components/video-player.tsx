import "vidstack/styles/defaults.css";
import { MediaOutlet, MediaPlayer } from "@vidstack/react";
import { MediaPlayerElement } from "vidstack";

interface Props extends Pick<MediaPlayerElement, "src" | "poster"> {
  className?: string;
}
export default function VideoPlayer({ src, poster, className }: Props) {
  return (
    <MediaPlayer src={src} poster={poster} className={className} controls>
      <MediaOutlet />
    </MediaPlayer>
  );
}

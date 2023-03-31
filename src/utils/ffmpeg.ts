import { log } from "@/utils/logger";
import type { CreateFFmpegOptions, FFmpeg } from "@ffmpeg/ffmpeg";
import {
  createFFmpeg as originalCreateFFmpeg,
  fetchFile
} from "@ffmpeg/ffmpeg";
import { Readable } from "stream";

const CRITICAL_ERRORS = [
  "WebAssembly.Memory(): could not allocate memory",
  "abort(OOM)",
  "Pthread aborting at Error",
];

function handleMaybeOutOfMemory(message: string, ffmpeg: FFmpeg) {
  if (CRITICAL_ERRORS.some((e) => message?.includes(e))) {
    log.warn("Restarting ffmpeg because it ran out of memory...");
    ffmpeg.exit();
    process.exit(1);
  }
}

export async function createFFmpeg(): Promise<FFmpeg> {
  let ffmpeg: FFmpeg | undefined;
  try {
    ffmpeg = originalCreateFFmpeg({
      log: true,
      wasmPath: "./node_modules/@ffmpeg/ffmpeg/dist/ffmpeg-core.wasm",
      logger: ({ type, message }: { type: string; message: string }) => {
        switch (type) {
          case "info":
            log.info(message);
            break;
          case "fferr":
            log.error(message);
            break;
          case "ffout":
            log.debug(message);
            break;
          default:
            log.warn(message);
            break;
        }

        handleMaybeOutOfMemory(message, ffmpeg!);
      },
    } as CreateFFmpegOptions);

    if (!ffmpeg.isLoaded()) await ffmpeg.load();
    return ffmpeg;
  } catch (error: any) {
    handleMaybeOutOfMemory(error.message, ffmpeg!);
    throw error;
  }
}

export async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];

    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

export { fetchFile };

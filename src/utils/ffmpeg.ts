import type { CreateFFmpegOptions, FFmpeg } from "@ffmpeg/ffmpeg";
import {
  createFFmpeg as originalCreateFFmpeg,
  fetchFile,
} from "@ffmpeg/ffmpeg";
import { log } from "@/utils/logger";
import { Readable } from "stream";

export async function createFFmpeg(): Promise<FFmpeg> {
  let ffmpeg: FFmpeg | undefined;
  try {
    ffmpeg = originalCreateFFmpeg({
      log:
        process.env.NODE_ENV === "development" ||
        process.env.NODE_ENV === "test",
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
      },
      progress: ({ ratio }: { ratio: number }) => {
        const percentage = Math.floor(ratio * 100);
        const barLength = 20;
        const completedBar = "=".repeat(Math.floor(ratio * barLength));
        const remainingBar = " ".repeat(barLength - completedBar.length);
        const message = `[${completedBar}${remainingBar}] ${percentage}%`;
        log.info(message);
      },
    } as CreateFFmpegOptions);

    if (!ffmpeg.isLoaded()) await ffmpeg.load();
    return ffmpeg;
  } catch (error) {
    if (error instanceof Error) {
      log.error(error.message);
    }

    if (
      error instanceof RangeError &&
      error?.message?.includes(
        "WebAssembly.Memory(): could not allocate memory"
      )
    ) {
      log.warn("Restarting ffmpeg because it ran out of memory...");
      ffmpeg?.exit();
      return createFFmpeg();
    }
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

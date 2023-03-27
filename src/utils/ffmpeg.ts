import type { CreateFFmpegOptions } from '@ffmpeg/ffmpeg';
import { createFFmpeg as originalCreateFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { log } from 'next-axiom';
import { Readable } from "stream";

export async function createFFmpeg() {

    const ffmpeg = originalCreateFFmpeg({
        log: true,
        wasmPath: './node_modules/@ffmpeg/ffmpeg/dist/ffmpeg-core.wasm',
        logger: ({ type, message }: { type: string, message: string }) => {
            switch (type) {
                case 'info':
                    log.info(message)
                    break;
                case 'fferr':
                    log.error(message)
                    break;
                case 'ffout':
                    log.debug(message)
                    break;
                default:
                    log.warn(message)
                    break;
            }
        },
        progress: ({ ratio }: { ratio: number }) => {
            log.info(`progress: %${(ratio * 100).toFixed(2)}`);
        },
    } as CreateFFmpegOptions);

    if (!ffmpeg.isLoaded()) await ffmpeg.load();
    return ffmpeg;
};


export async function streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = [];

        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
}

export { fetchFile };

// @ts-ignore
import { getCreateFFmpegCore } from '@ffmpeg/core';
import type { CreateFFmpegOptions } from '@ffmpeg/ffmpeg';
import { createFFmpeg as originalCreateFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { log } from 'next-axiom';
import path from 'path';


export async function createFFmpeg() {
    const ffmpeg = originalCreateFFmpeg({
        log: true,
        getCreateFFmpegCore,
        corePath: path.resolve(process.cwd(), 'node_modules/@ffmpeg/core/dist/ffmpeg-core.js'),
        workerPath: path.resolve(process.cwd(), 'node_modules/@ffmpeg/core/dist/ffmpeg-core.worker.js'),
        wasmPath: path.resolve(process.cwd(), 'node_modules/@ffmpeg/core/dist/ffmpeg-core.wasm'),
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
            log.info(`progress: %${Math.floor(ratio * 100)}`)
        },
    } as CreateFFmpegOptions);

    if (!ffmpeg.isLoaded()) await ffmpeg.load();
    return ffmpeg;
};

export { fetchFile };
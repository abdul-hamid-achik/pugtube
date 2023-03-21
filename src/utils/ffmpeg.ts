// @ts-ignore
import { getCreateFFmpegCore } from '@ffmpeg/core';
import type { CreateFFmpegOptions } from '@ffmpeg/ffmpeg';
import { createFFmpeg as originalCreateFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import fs from 'fs';
import { log } from 'next-axiom';
import path from 'path';

function logDirectoryContents(dir: string) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            console.log(`Directory: ${filePath}`);
            logDirectoryContents(filePath);
        } else {
            console.log(`File: ${filePath}`);
        }
    });
}

export async function createFFmpeg() {
    logDirectoryContents(process.cwd());

    const ffmpeg = originalCreateFFmpeg({
        log: true,
        getCreateFFmpegCore,
        corePath: path.resolve(process.cwd(), 'public', 'ffmpeg-core.js'),
        workerPath: path.resolve(process.cwd(), 'public', 'ffmpeg-core.worker.js'),
        wasmPath: path.resolve(process.cwd(), 'public', 'ffmpeg-core.wasm'),
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

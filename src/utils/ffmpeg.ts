import { log } from 'next-axiom';
// @ts-ignore
import originalGetCreateFFmpegCore from '@ffmpeg/ffmpeg/src/node/getCreateFFmpegCore';
// @ts-ignoreimport { log } from 'next-axiom';
import type { CreateFFmpegOptions } from '@ffmpeg/ffmpeg';
import { createFFmpeg as originalCreateFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
const getCreateFFmpegCore = (options: any) => {
    const modifiedOptions = { ...options, corePath: '@ffmpeg/core/dist/ffmpeg-core.js' };
    return originalGetCreateFFmpegCore(modifiedOptions);
};

export async function createFFmpeg() {
    const ffmpeg = originalCreateFFmpeg({
        log: true,
        getCreateFFmpegCore,
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

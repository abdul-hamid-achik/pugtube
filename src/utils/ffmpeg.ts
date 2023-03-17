import { log } from 'next-axiom';
// @ts-ignore
import originalGetCreateFFmpegCore from '@ffmpeg/ffmpeg/src/node/getCreateFFmpegCore';
// @ts-ignore
import { createFFmpeg } from '@ffmpeg/ffmpeg/src/createFFmpeg';
// @ts-ignore
export { fetchFile } from '@ffmpeg/ffmpeg/src/node/fetchFile';

const getCreateFFmpegCore = (options: any) => {
    const modifiedOptions = { ...options, corePath: '@ffmpeg/core/dist/ffmpeg-core.js' };
    return originalGetCreateFFmpegCore(modifiedOptions);
};

const ffmpeg = createFFmpeg({
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
});

if (!ffmpeg.isLoaded()) await ffmpeg.load();

export default ffmpeg;
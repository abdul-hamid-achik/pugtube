import fs from 'fs';
import status from 'http-status';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const corePath = path.dirname(require.resolve('@ffmpeg/core'));
        const coreFile = path.join(corePath, 'dist', 'ffmpeg-core.js');
        const coreContent = fs.readFileSync(coreFile, 'utf-8');

        res.setHeader('Content-Type', 'application/javascript');
        res.status(status.OK).send(coreContent);
    } catch (err) {
        res.status(status.INTERNAL_SERVER_ERROR).json({ error: 'Failed to load ffmpeg-core', message: err.message });
    }
}

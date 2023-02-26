import { NextApiRequest, NextApiResponse } from 'next';
import NodeMediaServer from 'node-media-server';

const config = {
    rtmp: {
        port: 1935,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60,
    },
    http: {
        port: 8000,
        allow_origin: '*',
        mediaroot: './media',
    },
};

const mediaServer = new NodeMediaServer(config);
mediaServer.run();

export default function broadcastHandler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== 'POST') {
        res.status(405).end(); // Method Not Allowed
        return;
    }

    const { streamId } = req.query as { streamId: string };

    // Start the RTMP stream
    mediaServer.on('prePublish', (id, StreamPath, args) => {
        if (StreamPath.includes(streamId)) {
            console.log(`RTMP stream started for stream ID "${streamId}"`);
        } else {
            console.log(`RTMP stream started for unknown stream "${StreamPath}"`);
            // should reject here
            mediaServer.getSession(id)
        }
    });

    // Stop the RTMP stream
    mediaServer.on('donePublish', (id, StreamPath, args) => {
        if (StreamPath.includes(streamId)) {
            console.log(`RTMP stream stopped for stream ID "${streamId}"`);
        } else {
            console.log(`RTMP stream stopped for unknown stream "${StreamPath}"`);
        }
    });

    res.status(200).end(); // OK
}

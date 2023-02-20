import { inngest } from '@/server/background';
import { prisma } from '@/server/db';
import { VideoMetadata } from '@prisma/client';
import { log as logger } from 'next-axiom';
const log = logger.with({ function: 'Update Metadata' });

export default inngest.createFunction('Update video metadata', 'pugtube/hls.update', async ({ event }) => {
    log.info('Updating metadata...')
    const { uploadId, metadata } = event.data as { uploadId: string, metadata: VideoMetadata };

    log.info(`Updating metadata for upload ID: ${uploadId}...`)

    // Update the metadata for the uploaded video in the database
    const upload = await prisma.upload.update({
        where: {
            id: uploadId,
        },
        data: {
            metadata: {
                update: metadata,
            },
            transcoded: true,
        },
    });
    log.debug("upload", upload)

    // Log success message
    log.info(`Metadata updated for upload ID: ${uploadId}`);
    await inngest.send('pugtube/hls.updated', { data: { upload } })
    return upload;
});
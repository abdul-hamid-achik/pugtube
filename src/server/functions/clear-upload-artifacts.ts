import { inngest } from '@/server/background';
import { deleteObject } from '@/utils/s3';
import { log } from 'next-axiom';

export default inngest.createFunction('Cleaning up upload artifacts', 'pugtube/hls.cleanup', async ({ event }) => {
    const { uploadId } = event.data as { uploadId: string };
    log.info('Deleting original video from S3', { uploadId });

    await deleteObject(`https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadId}`);
    await deleteObject(`https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadId}.info`);

    log.info(`Deleted original video from S3 for upload ID: ${uploadId}`);

    inngest.send('pugtube/hls.cleaned-up', { data: { uploadId } });
});
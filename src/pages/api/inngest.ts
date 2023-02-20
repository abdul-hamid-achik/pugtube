import { inngest } from '@/server/background';
import transcodeVideo from '@/server/functions/transcode-video';
import updateMetadata from '@/server/functions/update-metadata';
import uploadToS3 from '@/server/functions/upload-to-s3';
import { serve } from 'inngest/next';

const postUpload = inngest.createFunction('Post Upload', 'post-upload', async ({ event, step }) => {
  // Extract the upload ID from the event data
  const { uploadId } = event.data as { uploadId: string };

  // Run the transcoding step
  await step.run('Transcode video', async () => {
    return await inngest.send(
      'pugtube/hls.transcode',
      { data: { uploadId } }
    )
  });

  await step.waitForEvent("hls.transcoded", {
    timeout: 1000 * 60 * 60,
  });

  // Run the upload to S3 step
  await step.run('Uploading to S3', async () => {
    return await inngest.send(
      'pugtube/hls.upload',
      { data: { uploadId } }
    )
  });

  await step.waitForEvent("pugtube/hls.uploaded", {
    timeout: 1000 * 60 * 60,
  });

  // Run the update metadata step
  await step.run('Updating metadata', async () => {
    return await inngest.send(
      'pugtube/hls.update',
      { data: { uploadId } }
    )
  });

  await step.waitForEvent("pugtube/hls.updated", {
    timeout: 1000 * 60 * 60,
  });

  // Return the upload ID
  return uploadId;
});

export default serve('pugtube', [postUpload, transcodeVideo, uploadToS3, updateMetadata]);

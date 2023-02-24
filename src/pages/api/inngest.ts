import { inngest } from '@/server/background';
import generateThumbnail from '@/server/functions/generate-thumbnail';
import transcodeVideo from '@/server/functions/transcode-video';
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

  await step.run("Generate video thumbnail", async () => {
    return await inngest.send(
      'pugtube/thumbnail.generate',
      { data: { uploadId } }
    )
  });

  // await step.waitForEvent("pugtube/hls.transcoded", {
  //   timeout: 1000 * 60 * 60,
  // });

  // await step.waitForEvent("pugtube/hls.thumbnail.generated", {
  //   timeout: 1000 * 60 * 60,
  // });

  return uploadId;
});

export default serve('pugtube', [postUpload, transcodeVideo, generateThumbnail]);

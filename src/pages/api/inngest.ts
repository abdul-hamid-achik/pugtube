import { inngest } from '@/server/background';
import clearUploadArtifacts from '@/server/functions/clear-upload-artifacts';
import generateThumbnail from '@/server/functions/generate-thumbnail';
import transcodeVideo from '@/server/functions/transcode-video';
import { serve } from 'inngest/next';

const timeout = 5 * 60 * 1000; // 5 minutes
const postUpload = inngest.createFunction('Post Upload', 'post-upload', async ({ event, step }) => {
  const { uploadId } = event.data as { uploadId: string };

  await step.run("Generate video thumbnail", async () => {
    return await inngest.send(
      'pugtube/hls.thumbnail',
      { data: { uploadId } }
    )
  });

  await step.run('Transcode video', async () => {
    return await inngest.send(
      'pugtube/hls.transcode',
      { data: { uploadId } }
    )
  });

  await step.waitForEvent("pugtube/hls.thumbnailed", {
    timeout
  });

  await step.waitForEvent("pugtube/hls.transcoded", {
    timeout
  });

  await step.run("Cleaning up upload artifacts", async () => {
    return await inngest.send(
      'pugtube/hls.cleanup',
      { data: { uploadId } }
    )
  });

  await step.waitForEvent("pugtube/hls.cleaned-up", {
    timeout
  });

  return uploadId;
});

export default serve('pugtube', [postUpload, transcodeVideo, generateThumbnail, clearUploadArtifacts]);

import { Worker } from "bullmq";
import dotenv from "dotenv";
dotenv.config();

import IORedis from "ioredis";
import clearUploadArtifacts from "./server/functions/clear-upload-artifacts";
import generateThumbnail from "./server/functions/generate-thumbnail";
import transcodeVideo from "./server/functions/transcode-video";

const connection = new IORedis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: 3,
});

const worker = new Worker(
  "hls",
  async ({ data: { uploadId } }) => {

    await transcodeVideo({ uploadId });
    await generateThumbnail({ uploadId });
    await clearUploadArtifacts({ uploadId });

  },
  { connection }
);

worker.on("ready", () => {
  console.log("connected");
});

worker.on("completed", (job) => {
  console.info(job);
});

worker.on("failed", (job, err) => {
  console.info("FAILED", job);
  console.error("FAILED", err);
});

worker.on("error", (err) => {
  console.error(err);
});



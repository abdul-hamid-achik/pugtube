import { Worker } from "bullmq";
import dotenv from "dotenv";
dotenv.config();

import clearUploadArtifacts from "./server/functions/clear-upload-artifacts";
import generateThumbnail from "./server/functions/generate-thumbnail";
import transcodeVideo from "./server/functions/transcode-video";

const connection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT as string),
  password: process.env.REDIS_PASSWORD,
};

const worker = new Worker(
  "hls",
  async ({ data: { uploadId } }) => {
    // await import("./server/functions/generate-thumbnail").then((m) =>
    //   m.default({ uploadId })
    // );

    // await import("./server/functions/transcode-video").then((m) =>
    //   m.default({ uploadId })
    // );

    // await import("./server/functions/clear-upload-artifacts").then((m) =>
    //   m.default({ uploadId })
    // );

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



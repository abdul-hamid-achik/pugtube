import clearUploadArtifacts from "@/server/functions/clear-upload-artifacts";
import generateThumbnail from "@/server/functions/generate-thumbnail";
import transcodeVideo from "@/server/functions/transcode-video";
import { Worker } from "bullmq";
import dotenv from "dotenv";
import IORedis from "ioredis";
import { log as logger } from 'next-axiom';
import fetch from 'node-fetch';

try {
  dotenv.config();
} catch (e: any) {
  console.error("failed to load env in worker", e);
  process.exit(1);
}

dotenv.config();

const { env } = require('./env/server.mjs');

const log = env.NODE_ENV === 'production' ? logger : console;

// @ts-ignore
global.fetch = fetch;

const connection = new IORedis(env.REDIS_URL as string, {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "hls",
  async ({ data: { uploadId, fileName } }) => {
    log.info(`Processing job for upload ID: ${uploadId}...`)

    await Promise.all([
      transcodeVideo({ uploadId, fileName }),
      generateThumbnail({ uploadId, fileName })
    ]);
    await clearUploadArtifacts({ uploadId });

    log.info(`Finished processing job for upload ID: ${uploadId}`);
  },
  { connection }
);

worker.on("ready", () => {
  log.info("Worker connected");
});

worker.on("completed", (job) => {
  log.info("Job completed", job);
});

worker.on("failed", (job, err) => {
  log.warn("Job failed", job);
  log.error("Job failed with error", err);
});

worker.on("error", (err) => {
  log.error("Worker error", err);
});
import * as jobs from "@/server/jobs";
import * as Sentry from "@sentry/node";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import fetch from "node-fetch";
import { log } from "@/utils/logger";

// @ts-ignore
import dotenv from "dotenv-vault-core";

dotenv.config();

const { env } = require("./env/server.mjs");

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

// @ts-ignore
global.fetch = fetch;

export const connection = new IORedis(env.REDIS_URL as string, {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "hls",
  async (job) => {
    const {
      name,
      data: { videoId, uploadId, fileName, ...opts },
    } = job;
    log.info(`Processing job: ${name}`);
    try {
      switch (name) {
        case "backfill":
          // TODO: move this to a flow
          // TODO: refactor args to ony need a videoId instead of uploadId and fileName
          await jobs.extractThumbnails({ uploadId, fileName });
          await jobs.analyzeVideo({ uploadId, fileName });
          await jobs.transcodeVideo({ uploadId, fileName });
          await jobs.generateThumbnail({ uploadId, fileName });
          await jobs.generatePreview({ uploadId, fileName });
          break;

        case "post-upload":
          // TODO: move this to a flow
          // TODO: refactor args to ony need a videoId instead of uploadId and fileName
          await jobs.moveUpload({ uploadId, fileName });
          await jobs.extractThumbnails({ uploadId, fileName });
          await jobs.analyzeVideo({ uploadId, fileName });
          await jobs.transcodeVideo({ uploadId, fileName });
          await jobs.generateThumbnail({ uploadId, fileName });
          await jobs.generatePreview({ uploadId, fileName });
          break;

        case "extract-thumbnails":
          await jobs.extractThumbnails({ uploadId, fileName });
          break;

        case "analyze-video":
          await jobs.analyzeVideo({ uploadId, fileName });
          break;

        case "transcode-video":
          await jobs.transcodeVideo({ uploadId, fileName, ...opts });
          break;

        case "generate-preview":
          await jobs.generatePreview({ uploadId, fileName, ...opts });
          break;

        case "generate-thumbnail":
          await jobs.generateThumbnail({ uploadId, fileName, ...opts });
          break;

        case "delete-video-artifacts":
          await jobs.deleteVideoArtifacts({ videoId });
          break;

        default:
          log.error(`Unknown job name: ${name}`);
          break;
      }

      log.info(`Finished Job: ${name}`);
    } catch (err) {
      Sentry.captureException(err, { tags: { job: name } });
      throw err;
    }
  },
  { connection }
);

worker.on("ready", () => {
  log.info("Worker connected");
});

worker.on("completed", (job) => {
  const { name } = job.data;
  log.info(`Job completed: ${name}`);
});

worker.on("failed", async (job, error) => {
  const name = job?.name;
  log.warn(`Job failed: ${name}`, error);
  process.exit(1);
  await worker.close();
});

export default worker;

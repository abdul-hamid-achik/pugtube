import * as functions from '@/server/functions';
import * as Sentry from '@sentry/node';
import { Worker } from "bullmq";
import dotenv from "dotenv";
import IORedis from "ioredis";
import { log as logger } from 'next-axiom';
import fetch from 'node-fetch';

dotenv.config();

const { env } = require('./env/server.mjs');

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

const log = env.NODE_ENV === 'production' ? logger : console;

// @ts-ignore
global.fetch = fetch;

const connection = new IORedis(env.REDIS_URL as string, {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "hls",
  async (job) => {
    const { name, data: { videoId, uploadId, fileName, ...opts } } = job;
    log.info(`Processing job: ${name}`);
    try {
      switch (name) {
        case 'post-upload':
          await functions.moveUpload({ uploadId, fileName });

          await Promise.all([
            functions.transcodeVideo({ uploadId, fileName }),
            functions.generateThumbnail({ uploadId, fileName })
          ]);
          break;

        case 'transcode-video':
          await functions.transcodeVideo({ uploadId, fileName, ...opts });
          break;

        case 'generate-thumbnail':
          await functions.generateThumbnail({ uploadId, fileName, ...opts });
          break;

        case 'delete-video-artifacts':
          await functions.deleteVideoArtifacts({ videoId });
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

worker.on("failed", (job, err) => {
  const { name } = job?.data;
  Sentry.captureException(err, { tags: { job: name } });
  log.warn(`Job failed: ${name}`, err);
});

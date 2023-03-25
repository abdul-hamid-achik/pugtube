import * as functions from '@/server/functions';
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

const { env } = require('./env/server.mjs');

import * as Sentry from '@sentry/node';

import * as Tracing from '@sentry/tracing';

console.log(Tracing)
Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

// const transaction = Sentry.startTransaction({
//   op: "test",
//   name: "My First Test Transaction",
// });

// setTimeout(() => {
//   try {
//     // @ts-ignore
//     foo();
//   } catch (e) {
//     Sentry.captureException(e);
//   } finally {
//     transaction.finish();
//   }
// }, 99);

const log = env.NODE_ENV === 'production' ? logger : console;

// @ts-ignore
global.fetch = fetch;

const connection = new IORedis(env.REDIS_URL as string, {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "hls",
  async ({ name, data: { videoId, uploadId, fileName, ...opts } }) => {
    const transaction = Sentry.startTransaction({
      op: "worker",
      name: `Processing job: ${name}`,
    });
    log.info(`Processing job: ${name}`)
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
    transaction.finish();
    log.info(`Finished Job: ${name}`);
  },
  { connection }
);

worker.on("ready", () => {
  log.info("Worker connected");
});

worker.on("completed", (job) => {
  log.info("Job completed", job.asJSON());
});

worker.on("failed", (job, err) => {
  log.warn("Job failed", job?.asJSON());
  log.error("Job failed with error", err);
});

worker.on("error", (err) => {
  log.error("Worker error", err);
});

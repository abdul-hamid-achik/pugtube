import * as Sentry from "@sentry/node";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import fetch from "node-fetch";
import { log } from "@/utils/logger";

// @ts-ignore
import dotenv from "dotenv-vault-core";
import * as jobs from "@/server/jobs";

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

const registry: {
  [key: string]: (data: any) => Promise<void>;
} = {};

// @ts-ignore
Object.keys(jobs).forEach((job) => (registry[job] = jobs[job]));

const worker = new Worker(
  "hls",
  async (job) => {
    const { name, data } = job;
    log.info(`Processing job: ${name}`);
    try {
      if (registry[name]) {
        await registry[name]!(data);
      } else {
        log.error(`Unknown job name: ${name}`);
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
  log.info(`Worker ID: ${worker.id}`);
  log.info(`Worker name: ${worker.name}`);
  log.info(`Worker is ready`);
  log.info(`Job registry: ${JSON.stringify(registry)}`);
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

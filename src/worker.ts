import { log } from "@/utils/logger";
import { connection } from "@/utils/redis";
import * as Sentry from "@sentry/node";
import { Worker } from "bullmq";
import dotenv from "dotenv-vault-core";
import fetch from "node-fetch";

// @ts-ignore
global.fetch = fetch

dotenv.config();

const { env } = require("./env/server.mjs");

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  tracesSampleRate: 1.0,
});

const worker = new Worker(
  process.env.WORKER_NAME || "hls",
  async (job) => {
    const { getJob, isJobRegistered } = await import("@/server/jobs");
    const { name, data } = job;
    log.info(`Processing job: ${name}`);
    log.debug(`Job data: ${JSON.stringify(data)}`);
    try {
      if (isJobRegistered(name)) {
        const job = getJob(name)!;
        await job(data);
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
});

worker.on("completed", (job) => {
  const { name } = job.data;
  log.info(`Job completed: ${name}`);
});

worker.on("failed", async (job, error) => {
  const name = job?.name;
  log.error(`Job failed: ${name}`, error);
  process.exit(1);
});

export default worker;

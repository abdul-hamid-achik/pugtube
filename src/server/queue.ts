import { env } from "@/env/server.mjs";
import { Queue } from "bullmq";
import IORedis from "ioredis";

export const connection = new IORedis(env.REDIS_URL as string, {
  maxRetriesPerRequest: null,
});

const queue = new Queue("hls", {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});

export default queue;

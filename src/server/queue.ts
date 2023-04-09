import { Queue } from "bullmq";
import { connection } from "@/utils/redis";
import { env } from "@/env/server.mjs";

export const jobOptions = {
  removeOnComplete: { age: 1000 * 60 * 60 * 24 }, // 1 day
  removeOnFail: { age: 1000 * 60 * 60 * 24 },
  attempts: 1,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
};

const queue = new Queue(env.WORKER_NAME || "default", {
  connection,
  defaultJobOptions: jobOptions,
});

export default queue;

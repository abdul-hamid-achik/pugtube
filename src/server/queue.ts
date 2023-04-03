import { Queue } from "bullmq";
import { connection } from "@/utils/redis";
import { env } from "@/env/server.mjs";

const queue = new Queue(env.WORKER_QUEUE, {
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

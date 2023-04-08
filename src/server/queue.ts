import { Queue } from "bullmq";
import { connection } from "@/utils/redis";
import { env } from "@/env/server.mjs";

const queue = new Queue(env.WORKER_NAME || "default", {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});

export default queue;

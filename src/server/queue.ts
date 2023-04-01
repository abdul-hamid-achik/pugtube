import { Queue } from "bullmq";
import { connection } from "@/utils/redis";

const queue = new Queue(process.env.QUEUE_NAME || "hls", {
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

import { Queue } from "bullmq";
import { getConnection } from "@/utils/redis";

const queue = new Queue(process.env.QUEUE_NAME || "hls", {
  connection: getConnection(),
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

export const getQueue = () => queue;
export default getQueue;

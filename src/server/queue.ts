import { Job, Queue } from "bullmq";
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

export type BullMqJob = Omit<
  Job,
  | "toJSON"
  | "scripts"
  | "addJob"
  | "changeDelay"
  | "extendLock"
  | "getState"
  | "moveToDelayed"
  | "moveToWaitingChildren"
  | "promote"
  | "updateProgress"
  | "discard"
  | "queue"
  | "asJSON"
  | "asJSONSandbox"
  | "update"
  | "log"
  | "clearLogs"
  | "remove"
  | "moveToCompleted"
  | "moveToFailed"
  | "isCompleted"
  | "isFailed"
  | "isDelayed"
  | "isWaitingChildren"
  | "isActive"
  | "isWaiting"
  | "queueName"
  | "prefix"
  | "queueQualifiedName"
  | "getChildrenValues"
  | "getDependencies"
  | "getDependenciesCount"
  | "waitUntilFinished"
  | "retry"
>;

export default queue;

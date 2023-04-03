import IORedis from "ioredis";

export const connection = new IORedis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: null,
  connectionName: process.env.WORKER_NAME,
  connectTimeout: 5_000,
});

export default connection;

import IORedis from "ioredis";

export const getConnection = () =>
  new IORedis(process.env.REDIS_URL as string, {
    maxRetriesPerRequest: null,
    connectionName: process.env.WORKER_NAME || "hls",
    connectTimeout: 5_000,
  });

export default getConnection;

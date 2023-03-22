
import { env } from '@/env/server.mjs';
import { Queue } from 'bullmq';
import IORedis from "ioredis";

const connection = new IORedis(env.REDIS_URL as string, {
    maxRetriesPerRequest: null,
});

const queue = new Queue('hls', {
    connection
});

export default queue

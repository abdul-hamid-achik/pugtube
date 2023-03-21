
import { Queue } from 'bullmq';

const connection = {
    url: process.env.REDIS_HOST as string,
    port: process.env.REDIS_PORT as unknown as number,
    password: process.env.REDIS_PASSWORD as string,
}

const queue = new Queue('hls', {
    connection
});

export default queue

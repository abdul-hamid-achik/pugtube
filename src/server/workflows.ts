import { FlowProducer } from "bullmq";
import { env } from "@/env/server.mjs";
import { connection } from "@/utils/redis";
import { jobOptions } from "@/server/queue";

const flowProducer = new FlowProducer({
  connection,
});
export const createPostUploadFlow = async (
  data: { uploadId: string; fileName: string },
  queueName: string = env.WORKER_NAME || "default"
) => {
  return await flowProducer.add({
    name: "postUpload",
    queueName,
    data,

    children: [
      {
        name: "moveUpload",
        queueName,
        data,
        children: [
          {
            name: "extractThumbnails",
            queueName,
            data,
            children: [
              {
                name: "analyzeVideo",
                queueName,
                data,
              },
            ],
          },
          {
            name: "transcodeVideo",
            queueName,
            data,
          },
          {
            name: "generatePreview",
            queueName,
            data,
          },
          {
            name: "generateThumbnail",
            queueName,
            data,
          },
        ],
      },
    ],
  });
};

export const createBackfillFlow = async (
  data: { uploadId: string; fileName: string },
  queueName: string = env.WORKER_NAME || "default"
) => {
  return await flowProducer.add(
    {
      name: "backfill",
      queueName,
      data,
      children: [
        {
          name: "analyzeVideo",
          queueName,
          data,
          children: [
            {
              name: "extractThumbnails",
              queueName,
              data,
            },
          ],
        },
        {
          name: "transcodeVideo",
          queueName,
          data,
        },
        {
          name: "generatePreview",
          queueName,
          data,
        },
        {
          name: "generateThumbnail",
          queueName,
          data,
        },
      ],
    },
    {
      queuesOptions: {
        [queueName]: {
          defaultJobOptions: jobOptions,
        },
      },
    }
  );
};

export const workflows = {
  postUpload: createPostUploadFlow,
  backfill: createBackfillFlow,
};

import { FlowProducer } from "bullmq";

const flowProducer = new FlowProducer();
export const createPostUploadFlow = async (
  uploadId: string,
  fileName: string
) => {
  return await flowProducer.add({
    name: "post-upload",
    queueName: "hls",
    children: [
      {
        name: "moveUpload",
        queueName: "hls",
        children: [
          {
            name: "extractThumbnails",
            queueName: "hls",
            children: [
              {
                name: "analyzeVideo",
                queueName: "hls",
              },
            ],
          },
        ],
      },
      {
        name: "transcodeVideo",
        queueName: "hls",
      },
      {
        name: "generatePreview",
        queueName: "hls",
      },
      {
        name: "generateThumbnail",
        queueName: "hls",
      },
    ],
  });
};

export const createBackfillFlow = async (
  uploadId: string,
  fileName: string
) => {
  return await flowProducer.add({
    name: "backfill",
    queueName: "hls",
    children: [
      {
        name: "extractThumbnails",
        queueName: "hls",
        children: [
          {
            name: "analyzeVideo",
            queueName: "hls",
          },
        ],
      },
      {
        name: "transcodeVideo",
        queueName: "hls",
      },
      {
        name: "generatePreview",
        queueName: "hls",
      },
      {
        name: "generateThumbnail",
        queueName: "hls",
      },
    ],
  });
};

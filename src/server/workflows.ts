import { FlowProducer } from "bullmq";

const flowProducer = new FlowProducer();
export const createPostUploadFlow = async (
  data: { uploadId: string; fileName: string },
  queueName: string = "hls"
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
  });
};

export const createBackfillFlow = async (
  data: { uploadId: string; fileName: string },
  queueName: string = "hls"
) => {
  return await flowProducer.add({
    name: "backfill",
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
  });
};

export const workflows = {
  postUpload: createPostUploadFlow,
  backfill: createBackfillFlow,
};

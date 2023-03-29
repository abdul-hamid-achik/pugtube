import { env } from "@/env/server.mjs";
import { prisma } from "@/server/db";
import queue from "@/server/queue";
import type { Upload, VideoMetadata } from "@prisma/client";
import { S3Store } from "@tus/s3-store";
import { EVENTS, Server } from "@tus/server";
import type { NextApiRequest, NextApiResponse } from "next";
import { log } from "@/utils/logger";
import { v4 as uuidv4 } from "uuid";

interface PatchedUpload extends Upload {
  metadata: VideoMetadata;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

interface MetadataValidation {
  ok: boolean;
  expected: string;
  received: string;
}

const validateMetadata = (upload: PatchedUpload): MetadataValidation => {
  const received = upload?.metadata?.fileName || "";
  const validFileTypes = ["video/mp4", "video/quicktime"];
  const validFileName = /^[a-zA-Z0-9-_]+(\.[a-zA-Z0-9-_]+)*$/.test(
    upload?.metadata?.fileName || ""
  );
  const validFileType = validFileTypes.includes(upload?.metadata?.type || "");

  if (!validFileName) {
    throw {
      status_code: 500,
      body: `Invalid filename: ${received || "its just empty bro"}`,
    };
  }

  if (!validFileType) {
    throw {
      status_code: 500,
      body: `Invalid filetype: ${
        upload?.metadata?.type ||
        `these are the allowed filetypes: ${validFileTypes.join(", ")}`
      }`,
    };
  }

  return {
    ok: validFileName === validFileType,
    expected: `${validFileName ? "valid filename" : ""} ${
      validFileType ? "valid filetype" : ""
    }`,
    received,
  };
};

const tusServer = new Server({
  path: "/api/upload",
  respectForwardedHeaders: false,
  async onUploadCreate(_, response, upload) {
    const { ok, expected, received } = validateMetadata(
      upload as unknown as PatchedUpload
    );
    log.info(`Upload created: ${upload.id} ${ok ? "✅" : "❌"}`);

    if (!ok) {
      const body = `Expected "${expected}" in "Metadata" but received "${received}"`;
      log.error(body);
      throw { status_code: 500, body };
    }

    return response;
  },

  async onUploadFinish(_request, response, upload) {
    try {
      log.info(`Upload finished: ${upload.id}`);
      log.info(
        `Metadata: ${upload?.metadata?.filename} ${upload?.metadata?.type} ${upload?.metadata?.relativePath}`
      );

      const newUpload = await prisma.upload.create({
        data: {
          id: upload.id,
          size: upload.size,
          offset: upload.offset,
        },
      });

      log.info(`Upload created: ${newUpload.id} ✅`);

      const newMetadata = await prisma.videoMetadata.create({
        data: {
          fileName: upload?.metadata?.filename as string,
          type: upload?.metadata?.type as string,
          relativePath: upload?.metadata?.relativePath as string,
          name: upload?.metadata?.name as string,
          fileType: upload?.metadata?.filetype as string,
          uploadId: newUpload.id,
        },
      });

      log.info(`Metadata created: ${newMetadata.id} ✅`);

      return response;
    } catch (error: any) {
      log.error("Upload failed: ", {
        error: error.message,
        stack: error.stack,
      });
      throw { status_code: 500, body: error };
    }
  },
  namingFunction: () => uuidv4(),
  datastore: new S3Store({
    // partSize: 4_718_592, // 4.5 MB
    // partSize: 5_242_880, // 5 MB
    partSize: 10_485_760, // 10 MB
    s3ClientConfig: {
      region: env.AWS_REGION as string,
      accessKeyId: env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY as string,
      bucket: env.AWS_S3_BUCKET as string,
    },
  }),
});

tusServer.on(EVENTS.POST_FINISH, async (_request, _response, upload) => {
  log.info(`Event received: post-finish`, upload);

  await queue.add("post-upload", {
    uploadId: upload.id,
    fileName: upload?.metadata?.filename as string,
  });

  log.info(`Event sent: post-upload ✅`);
});

export default function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  return tusServer.handle(request, response);
}
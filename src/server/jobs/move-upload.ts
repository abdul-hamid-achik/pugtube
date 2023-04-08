import { moveObject } from "@/utils/s3";
import {
  GetObjectCommandInput,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import log from "@/utils/logger";
import { createBackfillFlow } from "@/server/workflows";
import { env } from "@/env/server.mjs";
import { prisma } from "@/server/db";

export default async function moveUpload({
  uploadId,
  fileName,
}: {
  uploadId: string;
  fileName: string;
}) {
  log.info(`Moving upload ${uploadId} to originals/${uploadId}/${fileName}...`);
  const upload = await prisma.upload.findUniqueOrThrow({
    where: {
      id: uploadId,
    },
  });

  if (upload.movedAt) {
    log.info(
      `Upload ${uploadId} already moved to originals/${uploadId}/${fileName}...`
    );
    return;
  }

  const getObjectInput: GetObjectCommandInput = {
    Bucket: env.AWS_S3_BUCKET,
    Key: uploadId,
  };

  const putObjectInput: PutObjectCommandInput = {
    Bucket: env.AWS_S3_BUCKET,
    Key: `originals/${uploadId}/${fileName}`,
  };

  await moveObject(getObjectInput, putObjectInput);

  log.info(`Moved upload ${uploadId} to originals/${uploadId}/${fileName}...`);
  const jobNode = await createBackfillFlow({
    uploadId,
    fileName,
  });

  await prisma.upload.update({
    where: {
      id: uploadId,
    },
    data: {
      movedAt: new Date(),
    },
  });

  log.info(`Created backfill flow for upload ${uploadId}...`);
  log.debug(`Backfill flow ID: ${jobNode?.job?.id || "unknown"}`);

  return jobNode;
}

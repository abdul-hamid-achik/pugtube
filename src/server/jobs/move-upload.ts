import { moveObject } from "@/utils/s3";
import {
  GetObjectCommandInput,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import log from "@/utils/logger";

import { env } from "@/env/server.mjs";

export default async function moveUpload({
  uploadId,
  fileName,
}: {
  uploadId: string;
  fileName: string;
}) {
  log.debug(
    `Moving upload ${uploadId} to originals/${uploadId}/${fileName}...`
  );

  const getObjectInput: GetObjectCommandInput = {
    Bucket: env.AWS_S3_BUCKET,
    Key: uploadId,
  };

  const putObjectInput: PutObjectCommandInput = {
    Bucket: env.AWS_S3_BUCKET,
    Key: `originals/${uploadId}/${fileName}`,
  };

  await moveObject(getObjectInput, putObjectInput);

  log.debug(`Moved upload ${uploadId} to originals/${uploadId}/${fileName}...`);
}

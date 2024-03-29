import { Sha256 } from "@aws-crypto/sha256-browser";
import {
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { parseUrl } from "@aws-sdk/url-parser";
import { formatUrl } from "@aws-sdk/util-format-url";
import log from "@/utils/logger";
import { Readable } from "stream";
import { env } from "@/env.mjs";

export const s3 = new S3Client({
  region: env.AWS_S3_REGION as string,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY as string,
  },
});

export async function moveObject(
  input: GetObjectCommandInput,
  output: PutObjectCommandInput
) {
  const object = await getObject(input);

  if (!object || !object.Body) {
    log.error(`Failed to get the object with Key: ${input.Key}`);
    return;
  }

  await putObject({
    ...output,
    Body: object.Body as Readable,
    ContentType: object.ContentType,
    ContentLength: object.ContentLength,
  });

  const deleteInput: DeleteObjectCommandInput = {
    Bucket: input.Bucket,
    Key: input.Key,
  };

  await deleteObject(deleteInput);
}

export async function getPresignedPutUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
) {
  const presigner = new S3RequestPresigner({
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY as string,
    },
    region: env.AWS_S3_REGION as string,
    sha256: Sha256,
  });

  const request = new HttpRequest({
    method: "PUT",
    protocol: "https",
    hostname: `${env.AWS_S3_BUCKET}.s3.${env.AWS_S3_REGION}.amazonaws.com`,
    path: `/${key}`,
    headers: {
      "Content-Type": contentType,
    },
  });

  const signedUrl = await presigner.presign(request, { expiresIn });
  return formatUrl(signedUrl);
}

export async function putObject(input: PutObjectCommandInput) {
  try {
    const result = await s3.send(new PutObjectCommand(input));
    log.info(`Uploaded to S3: ${input.Key}`);

    return result;
  } catch (error) {
    log.error(
      `Error uploading to S3: ${input.Key}`,
      error as { [key: string]: any }
    );
  }
}

export async function getSignedUrl(s3ObjectUrl: string) {
  const presigner = new S3RequestPresigner({
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY as string,
    },
    region: env.AWS_S3_REGION as string,
    sha256: Sha256,
  });

  const request = new HttpRequest(parseUrl(s3ObjectUrl));

  const signedUrl = await presigner.presign(request, {
    expiresIn: 3600, // 1 hour
  });

  return formatUrl(signedUrl);
}

export async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];

    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

export function parseS3ObjectUrl(s3ObjectUrl: string) {
  const match = s3ObjectUrl.match(/^https:\/\/(.+)\.s3\.(.+)\.(.+?)\/(.+)$/);

  if (!match || match.length !== 5) {
    throw new Error(`Invalid S3 object URL: ${s3ObjectUrl}`);
  }

  const [, bucket, region, endpoint, key] = match;

  return {
    bucket,
    region,
    endpoint,
    key,
  };
}

export async function getObject(input: GetObjectCommandInput) {
  try {
    const result = await s3.send(new GetObjectCommand(input));

    log.info(`Downloaded from S3: ${input.Key}`);

    return result;
  } catch (error) {
    log.error(
      `Error downloading from S3: ${input.Key}`,
      error as { [key: string]: any }
    );
  }
}

export async function deleteObject(input: DeleteObjectCommandInput) {
  try {
    const result = await s3.send(new DeleteObjectCommand(input));

    log.info(`Deleted from S3: ${input.Bucket}/${input.Key}`);

    return result;
  } catch (error) {
    log.error(
      `Error deleting from S3: ${input.Bucket}/${input.Key}`,
      error as { [key: string]: any }
    );
  }
}

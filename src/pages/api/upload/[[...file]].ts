import { inngest } from '@/server/background';
import { prisma } from '@/server/db';
import type { Upload, VideoMetadata } from '@prisma/client';
import { S3Store } from '@tus/s3-store';
import { Server } from '@tus/server';
import type { NextApiRequest, NextApiResponse } from 'next';
import { log as logger } from 'next-axiom';
import { v4 as uuid } from 'uuid';


interface PatchedUpload extends Upload {
  metadata: VideoMetadata
}

export const config = {
  api: {
    bodyParser: false,
  },
};

interface MetadataValidation { ok: boolean, expected: string, received: string }

const log = logger.with({ function: 'tus' });

const validateMetadata = (upload: PatchedUpload): MetadataValidation => {
  const received = upload?.metadata?.filename || '';
  const validFileTypes = ['video/mp4', 'video/quicktime'];
  const validFileName = /^[a-zA-Z0-9-_]+(\.[a-zA-Z0-9-_]+)*$/.test(upload?.metadata?.filename || '');
  const validFileType = validFileTypes.includes(upload?.metadata?.type || '');

  if (!validFileName) {
    throw { status_code: 500, body: `Invalid filename: ${received || 'its just empty bro'}` };
  }

  if (!validFileType) {
    throw { status_code: 500, body: `Invalid filetype: ${upload?.metadata?.type || `these are the allowed filetypes: ${validFileTypes.join(', ')}`}` };
  }

  return {
    ok: validFileName === validFileType,
    expected: `${validFileName ? 'valid filename' : ''} ${validFileType ? 'valid filetype' : ''}`,
    received,
  };
};

const tusServer = new Server({
  path: '/api/upload',
  async onUploadCreate(_, response, upload) {
    const { ok, expected, received } = validateMetadata(upload as unknown as PatchedUpload);
    log.info(`Upload created: ${upload.id} ${ok ? '✅' : '❌'}`);

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
      const newMetadata = await prisma.videoMetadata.create({
        data: {
          relativePath: upload?.metadata?.relativePath || '',
          name: upload?.metadata?.filename || '',
          type: upload?.metadata?.type || '',
          filename: upload?.metadata?.filename || '',
          filetype: upload?.metadata?.filetype || '',
          uploadId: upload?.id || '',
        },
      });

      log.info(`Metadata created: ${newMetadata.id} ✅`)

      const newUpload = await prisma.upload.create({
        data: {
          ...upload,
          metadata: {
            connect: {
              id: upload.id,
            },
          },
        },
      });

      log.info(`Upload created: ${newUpload.id} ✅`)

      await inngest.send({
        name: 'post-upload',
        data: {
          uploadId: newUpload.id,
        },
      });

      log.info(`Event sent: post-upload ✅`)

      return response;
    } catch (error) {
      log.error('Upload failed: ', error)
      throw { status_code: 500, body: error };
    }
  },
  namingFunction: () => uuid(),
  datastore: new S3Store({
    partSize: 8 * 1024 * 1024, // Each uploaded part will have ~8MB,
    s3ClientConfig: {
      region: process.env.AWS_REGION as string,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      bucket: process.env.AWS_S3_BUCKET as string,
      logger: console,
    },
  }),
});

export default function handler(request: NextApiRequest, response: NextApiResponse) {
  return tusServer.handle(request, response);
}

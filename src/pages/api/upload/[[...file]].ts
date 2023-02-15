/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/ban-ts-comment */

import type { NextApiRequest, NextApiResponse } from 'next'
import { Server } from '@tus/server';
import { S3Store } from '@tus/s3-store'
import { prisma } from '../../../server/db'
import type { Upload, VideoMetadata } from '@prisma/client'

interface PatchedUpload extends Upload {
  metadata: VideoMetadata
}

export const config = {
  api: {
    bodyParser: false,
  },
}

const validateMetadata = (upload: PatchedUpload): { ok: boolean, expected: string, received: string } => {
  const received = upload?.metadata?.filename || ''
  const valid_filetypes = ['video/mp4', 'video/quicktime']
  const valid_filename = /^[a-zA-Z0-9-_]+(\.[a-zA-Z0-9-_]+)*$/.test(upload?.metadata?.filename || '')
  const valid_filetype = valid_filetypes.includes(upload?.metadata?.type || '')

  if (!valid_filename) {
    throw { status_code: 500, body: `Invalid filename: ${received || 'its just empty bro'}` }
  }

  if (!valid_filetype) {
    throw { status_code: 500, body: `Invalid filetype: ${upload?.metadata?.type || `these are the allowed filetypes: ${valid_filetypes.join(', ')}`}` }
  }

  return {
    ok: valid_filename === valid_filetype,
    expected: `${valid_filename ? 'valid filename' : ''} ${valid_filetype ? 'valid filetype' : ''}`,
    received,
  }
}

const tusServer = new Server({
  path: '/api/upload',
  async onUploadCreate(_, response, upload) {
    const { ok, expected, received } = validateMetadata(upload as unknown as PatchedUpload)

    if (!ok) {
      const body = `Expected "${expected}" in "Metadata" but received "${received}"`
      console.error(body)
      throw { status_code: 500, body }
    }

    return response
  },

  async onUploadFinish(request, response, upload) {
    console.log('Upload finished')
    console.log(request)
    console.log(upload)

    const newMetadata = await prisma.videoMetadata.create({
      data: upload?.metadata as VideoMetadata,
    })


    console.log('newMetadata', newMetadata)

    const newUpload = await prisma.upload.create({
      data: {
        ...upload,
        metadata: {
          connect: {
            // @ts-ignore
            id: newMetadata.id,
          },
        },
      },
    })

    console.log('newUpload', newUpload)

    return response
  },
  datastore: new S3Store({
    partSize: 8 * 1024 * 1024, // Each uploaded part will have ~8MB,
    s3ClientConfig: {
      region: process.env.AWS_REGION as string,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      bucket: process.env.AWS_S3_BUCKET as string,
    },
  }),
})

export default function handler(request: NextApiRequest, response: NextApiResponse) {
  return tusServer.handle(request, response)
}

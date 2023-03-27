import { prisma } from '@/server/db';
import transcodeVideo from './transcode-video';
import { expect } from '@jest/globals';
import { getObject } from "@/utils/s3";

jest.mock('@/server/db', () => ({
  prisma: {
    video: {
      findFirst: jest.fn().mockResolvedValue({
        id: '0000000-0000-0000-0000-000000000000',
        userId: '0000000-0000-0000-0000-000000000000',
        uploadId: '0000000-0000-0000-0000-000000000000',
        title: 'Mixkit - Speeding Down a Highway in Point of View',
        description: 'Speeding Down a Highway in Point of View',
        category: 'Cars',
        duration: 10,
        thumbnailUrl: 'https://example.com/thumbnail.png',
        upload: {
          id: '0000000-0000-0000-0000-000000000000',
          userId: '0000000-0000-0000-0000-000000000000',
          fileName: 'mixkit-speeding-down-a-highway-in-point-of-view-44659.mp4',
          fileSize: 1000000,
          mimeType: 'video/mp4',
          metadata: {
            id: '0000000-0000-0000-0000-000000000000',
            uploadId: '0000000-0000-0000-0000-000000000000',
            width: 1920,
            height: 1080,
            duration: 10,

          }
        }
      }),
    },
    hlsPlaylist: {
      create: jest.fn().mockReturnValue({
        id: '0000000-0000-0000-0000-000000000000',
        video: {
          connect: {
            id: '0000000-0000-0000-0000-000000000000',
          },
        },
        playlistUrl: `https://example.com/0000000-0000-0000-0000-000000000000.m3u8`,
      })
    },
    hlsSegment: {
      create: jest.fn(),
    },
    upload: {
      update: jest.fn(),
    }
  },
}));

describe('transcodeVideo', () => {
  beforeEach(() => {
    // Remove this line:
    // jest.clearAllMocks();
  });
  it('should transcode video and upload to S3', async () => {
    const uploadId = '0000000-0000-0000-0000-000000000000';
    const fileName = 'mixkit-speeding-down-a-highway-in-point-of-view-44659.mp4';

    // Call the actual transcodeVideo function with the provided parameters
    await transcodeVideo({ uploadId, fileName });

    // Verify that prisma functions were called with the expected parameters
    expect(prisma.video.findFirst).toHaveBeenCalledWith({
      where: {
        uploadId: {
          equals: uploadId,
        },
      },
    });

    expect(prisma.hlsPlaylist.create).toHaveBeenCalled();
    expect(prisma.hlsSegment.create).toHaveBeenCalled();
    expect(prisma.upload.update).toHaveBeenCalled();

    // Verify that the S3 upload function was called with the expected parameters

    const playlist = await getObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `transcoded/${uploadId}/output.m3u8`
    });

    expect(playlist).toBeDefined();
    expect(playlist!.Body!.toString()).not.toBeNull();

    const segment1 = await getObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `transcoded/${uploadId}/segment-0.ts`
    });

    expect(segment1).toBeDefined();
    expect(segment1!.Body!.toString()).not.toBeNull();

    const segment2 = await getObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `transcoded/${uploadId}/segment-1.ts`
    });

    expect(segment2).toBeDefined();
    expect(segment2!.Body!.toString()).not.toBeNull();

    const segment3 = await getObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `transcoded/${uploadId}/segment-2.ts`
    });

    expect(segment3).toBeDefined();
    expect(segment3!.Body!.toString()).not.toBeNull();
  });

});

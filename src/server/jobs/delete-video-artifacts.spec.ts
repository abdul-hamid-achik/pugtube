import { prisma } from '@/server/db';
import { expect } from '@jest/globals';
import { deleteObject } from "@/utils/s3";
import deleteVideoArtifacts from './delete-video-artifacts';


jest.mock('@/utils/s3', () => ({deleteObject: jest.fn()}));
jest.mock('@/server/db', () => ({
  prisma: {
    upload: {
      delete: jest.fn(),
    },
    video: {
      findUnique: jest.fn().mockResolvedValue({
        id: '0000000-0000-0000-0000-000000000000',
        hlsPlaylist: {
          id: '0000000-0000-0000-0000-000000000000',
          playlistUrl: 'https://example.com/0000000-0000-0000-0000-000000000000.m3u8',
        },
        upload: {
          id: '0000000-0000-0000-0000-000000000000',
          metadataId: '0000000-0000-0000-0000-000000000000',
        }
      }),
      delete: jest.fn()
    },
    videoMetadata: {
      delete: jest.fn(),
    },

    hlsPlaylist: {
      delete: jest.fn(),
    },

    hlsSegment: {
      deleteMany: jest.fn(),
    }

  },
}));
describe('deleteVideoArtifacts', () => {
  beforeEach(() => {
    // Remove this line:
    // jest.clearAllMocks();
  });

  it('should delete video artifacts on s3 and also execute delete commands in backend', async () => {
    const videoId = '0000000-0000-0000-0000-000000000000';

    await deleteVideoArtifacts({ videoId });

    expect(prisma.video.findUnique).toHaveBeenCalled()
    expect(prisma.video.delete).toHaveBeenCalled()
    expect(prisma.videoMetadata.delete).toHaveBeenCalled()
    expect(prisma.hlsPlaylist.delete).toHaveBeenCalled()
    expect(prisma.hlsSegment.deleteMany).toHaveBeenCalled()
    expect(prisma.upload.delete).toHaveBeenCalled()


    expect(deleteObject).toHaveBeenCalledTimes(4);
  });
});

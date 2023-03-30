import analyzeVideo from "./analyze-video";
import { prisma } from "@/server/db";
import { expect } from "@jest/globals";

jest.mock("@/server/db", () => ({
  prisma: {
    video: {
      update: jest.fn(),
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        id: "0000000-0000-0000-0000-000000000000",
        userId: "0000000-0000-0000-0000-000000000000",
        uploadId: "0000000-0000-0000-0000-000000000000",
        title: "Mixkit - Speeding Down a Highway in Point of View",
        description: "Speeding Down a Highway in Point of View",
        category: "Cars",
        duration: 10,
        thumbnailUrl: "https://example.com/thumbnail.png",
        upload: {
          id: "0000000-0000-0000-0000-000000000000",
          userId: "0000000-0000-0000-0000-000000000000",
          fileName: "mixkit-speeding-down-a-highway-in-point-of-view-44659.mp4",
          fileSize: 1000000,
          mimeType: "video/mp4",
          metadata: {
            id: "0000000-0000-0000-0000-000000000000",
            uploadId: "0000000-0000-0000-0000-000000000000",
            width: 1920,
            height: 1080,
            duration: 10,
          },
        },
      }),
    },
    thumbnail: {
      createMany: jest.fn(),
    },
    contentTag: {
      createMany: jest.fn(),
    },
  },
}));

describe("analyzeVideo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should generate a thumbnail for every sec and upload all to S3", async () => {
    const uploadId = "0000000-0000-0000-0000-000000000000";
    const fileName =
      "mixkit-speeding-down-a-highway-in-point-of-view-44659.mp4";

    await analyzeVideo({ uploadId, fileName });

    expect(prisma.thumbnail.createMany).toHaveBeenCalled();
    expect(prisma.contentTag.createMany).toHaveBeenCalled();
    expect(prisma.video.update).toHaveBeenCalled();
  });
});

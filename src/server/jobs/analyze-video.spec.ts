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

        thumbnails: Array.from({ length: 12 }, (_, index) => {
          const key = `thumbnails/0000000-0000-0000-0000-000000000000-thumbnail-${
            index + 1
          }.jpg`;
          const id = index;
          return {
            key,
            id,
            url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`,
          };
        }),
      }),
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

  it("should analyze content with `mobilenet` for each thumbnail of every second of the video", async () => {
    const uploadId = "0000000-0000-0000-0000-000000000000";
    const fileName =
      "mixkit-speeding-down-a-highway-in-point-of-view-44659.mp4";

    await analyzeVideo({ uploadId, fileName });

    expect(prisma.contentTag.createMany).toHaveBeenCalled();
    expect(prisma.video.update).toHaveBeenCalled();
  });
});

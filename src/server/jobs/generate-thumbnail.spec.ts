import { expect } from "@jest/globals";
import { getObject } from "@/utils/s3";
import generateThumbnail from "./generate-thumbnail";

jest.mock("@/server/db", () => ({
  prisma: {
    video: {
      update: jest.fn(),
    },
  },
}));

describe("generateThumbnail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should generate a thumbnail and upload to S3", async () => {
    const uploadId = "0000000-0000-0000-0000-000000000000";
    const fileName =
      "mixkit-speeding-down-a-highway-in-point-of-view-44659.mp4";

    // Call the actual transcodeVideo function with the provided parameters
    await generateThumbnail({ uploadId, fileName });

    const thumbnail = await getObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `thumbnails/${uploadId}.png`,
    });

    expect(thumbnail).toBeDefined();
    expect(thumbnail!.Body!.toString()).not.toBeNull();
  });
});

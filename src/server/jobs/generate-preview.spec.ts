import { expect } from "@jest/globals";
import { getObject } from "@/utils/s3";
import generatePreview from "./generate-preview";

jest.mock("@/server/db", () => ({
  prisma: {
    video: {
      update: jest.fn(),
    },
  },
}));

describe("generatePreview", () => {
  beforeEach(() => {
    // Remove this line:
    // jest.clearAllMocks();
  });

  it("should generate a preview and upload to S3", async () => {
    const uploadId = "0000000-0000-0000-0000-000000000000";
    const fileName =
      "mixkit-speeding-down-a-highway-in-point-of-view-44659.mp4";

    await generatePreview({ uploadId, fileName });

    const preview = await getObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `previews/${uploadId}.gif`,
    });

    expect(preview).toBeDefined();
    expect(preview!.Body!.toString()).not.toBeNull();
  });
});

import { expect } from "@jest/globals";
import { moveObject } from "@/utils/s3";
import moveUpload from "./move-upload";

jest.mock("@/utils/s3", () => ({ moveObject: jest.fn() }));

describe("moveUpload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should move upload file to output key path", async () => {
    const { getObject } = jest.requireActual("@/utils/s3");

    const uploadId = "0000000-0000-0000-0000-000000000000";
    const fileName =
      "mixkit-speeding-down-a-highway-in-point-of-view-44659.mp4";

    await moveUpload({ uploadId, fileName });

    const upload = await getObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `originals/${uploadId}/${fileName}`,
    });

    expect(upload).toBeDefined();
    expect(upload!.Body!.toString()).not.toBeNull();
    expect(moveObject).toHaveBeenCalled();
  });
});

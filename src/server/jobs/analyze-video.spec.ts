import analzyzeVideo from "./analyze-video";

jest.mock("@/server/db", () => ({
  prisma: {
    video: {
      update: jest.fn(),
    },
  },
}));

describe("analyzeVideo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.skip("should generate a thumbnail for every sec and upload all to S3", async () => {
    const uploadId = "0000000-0000-0000-0000-000000000000";
    const fileName =
      "mixkit-speeding-down-a-highway-in-point-of-view-44659.mp4";

    await analzyzeVideo({ uploadId, fileName });
    throw Error("Not implemented yet");

    // const preview = await getObject({
    //   Bucket: process.env.AWS_S3_BUCKET,
    //   Key: `previews/${uploadId}.gif`,
    // });
    //
    // expect(preview).toBeDefined();
    // expect(preview!.Body!.toString()).not.toBeNull();
  });
});

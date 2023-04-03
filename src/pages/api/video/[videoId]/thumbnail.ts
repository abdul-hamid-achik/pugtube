import { getPresignedPutUrl } from "@/utils/s3";
import status from "http-status";
import { NextApiRequest, NextApiResponse } from "next";
import log from "@/utils/logger";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(status.METHOD_NOT_ALLOWED).end(status["405_MESSAGE"]);
    return;
  }

  const { videoId } = req.query;
  const contentType = req.headers["content-type"] || "image/png";

  try {
    const uploadKey = `thumbnails/${videoId}.png`;
    const presignedPutUrl = await getPresignedPutUrl(uploadKey, contentType);

    res.status(status.OK).json({ url: presignedPutUrl });
  } catch (error: any) {
    log.error("Error generating presigned URL", error);
    res.status(status.INTERNAL_SERVER_ERROR).end(status["500_MESSAGE"]);
  }
}

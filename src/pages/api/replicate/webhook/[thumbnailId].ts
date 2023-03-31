import { prisma } from "@/server/db";
import status from "http-status";
import { NextApiRequest, NextApiResponse } from "next";

interface Payload {
  id: string;
  version: string;
  input: {
    image: string;
  };
  logs: string;
  output: string;
  error: null | string;
  status: string;
  created_at: string;
  started_at: string;
  completed_at: string;
  webhook: string;
  webhook_events_filter: string[];
  urls: {
    cancel: string;
    get: string;
  };
  metrics: {
    predict_time: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { thumbnailId } = req.query as { thumbnailId: string };
  if (thumbnailId === "0000000-0000-0000-0000-000000000000") {
    res.status(status.OK).json({ message: "OK" });
    return;
  }
  const body: Payload = req.body;
  await prisma.thumbnail.update({
    where: {
      id: thumbnailId,
    },
    data: {
      caption: body.output,
    },
  });
  res.status(status.OK).json({ message: "OK" });
}

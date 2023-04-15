import { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm } from "formidable";
import { env } from "@/env.mjs";
import crypto from "crypto";
import status from "http-status";
import log from "@/utils/logger";
import { prisma } from "@/server/db";

const checkSignature = (fields: any, authSecret: any) => {
  const receivedSignature = fields.signature;
  const payload = fields.transloadit;
  const algoSeparatorIndex = receivedSignature.indexOf(":");
  const algo =
    algoSeparatorIndex === -1
      ? "sha1"
      : receivedSignature.slice(0, algoSeparatorIndex);

  try {
    const calculatedSignature = crypto
      .createHmac(algo, authSecret)
      .update(Buffer.from(payload, "utf-8"))
      .digest("hex");

    return (
      calculatedSignature === receivedSignature.slice(algoSeparatorIndex + 1)
    );
  } catch {
    return false;
  }
};

export default async function handler(
  req: NextApiRequest & { session?: { userId?: string } },
  res: NextApiResponse
) {
  if (
    !env.TRANSLOADIT_SECRET ||
    !/^[a-f0-9]{40}$/.test(env.TRANSLOADIT_SECRET)
  ) {
    res.status(status.BAD_REQUEST).json({
      message:
        "Please set the Auth Secret from https://transloadit.com/account/api-settings/ via the TRANSLOADIT_SECRET environment variable.",
    });
    return;
  }

  if (req.method === "OPTIONS") {
    res.status(status.NO_CONTENT).end();
    return;
  }

  if (req.method === "POST" && req.url === "/api/transloadit") {
    const form = new IncomingForm();

    form.parse(req, async (err: unknown, fields: any, files: any) => {
      if (err) {
        res.status(status.INTERNAL_SERVER_ERROR).json({
          messages: ["Error while parsing multipart form", err],
        });
        return;
      }

      if (!checkSignature(fields, env.TRANSLOADIT_SECRET)) {
        res.status(status.FORBIDDEN).json({
          messages: [
            "Error while checking signatures",
            "No match so payload was tampered with, or an invalid Auth Secret was used",
          ],
        });
        return;
      }

      let assembly: any = {};
      try {
        assembly = JSON.parse(fields.transloadit);
      } catch (err) {
        res.status(status.INTERNAL_SERVER_ERROR).json({
          messages: ["Error while parsing transloadit field", err],
        });
        return;
      }

      log.info(
        `--> ${assembly.ok || assembly.error} ${assembly.assembly_ssl_url}`
      );

      for (const upload of assembly.uploads) {
        log.info(`    ^- uploaded '${upload.name}' ready at ${upload.ssl_url}`);
      }

      const params = JSON.parse(assembly.params);
      const uploadId = params.steps.import.path;

      for (const stepName in assembly.results) {
        for (const result of assembly.results[stepName]) {
          log.info(
            `    ^- ${stepName} '${result.name}' ready at ${result.ssl_url}`
          );

          const asset = await prisma.asset.upsert({
            where: { id: result.id },
            update: {
              filename: result.name,
              mimeType: result.mime,
              size: result.size,
              url: result.ssl_url,
              width: result.meta.width,
              height: result.meta.height,
              duration: result.meta.duration || null,
              uploadId,
            },
            create: {
              id: result.id,
              filename: result.name,
              mimeType: result.mime,
              size: result.size,
              url: result.ssl_url,
              width: result.meta.width,
              height: result.meta.height,
              duration: result.meta.duration || null,
              uploadId,
            },
          });

          log.info("upserted asset", asset);
        }
      }

      res.status(status.OK).json({ messages: ["Success!"] });
    });
  } else {
    res.status(status.INTERNAL_SERVER_ERROR).json({
      messages: [
        "Welcome! I only know how to handle POSTs to /api/transloadit",
        `No handler for req.url=${req.url}, req.method=${req.method}`,
      ],
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

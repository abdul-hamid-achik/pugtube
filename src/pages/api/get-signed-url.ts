import { env } from '@/env/server.mjs';
import { prisma } from "@/server/db";
import queue from "@/server/queue";
import { s3 } from "@/utils/s3";
import { CompleteMultipartUploadCommand, CreateMultipartUploadCommand, UploadPartCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAuth } from "@clerk/nextjs/server";
import status from "http-status";
import { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from 'uuid';

export default async function handler(
    req: NextApiRequest & { session?: { userId?: string } },
    res: NextApiResponse
) {
    const { userId } = getAuth(req);

    if (!userId) {
        res.status(status.UNAUTHORIZED).json({ message: "Unauthorized" });
        return;
    }

    if (req.method === "POST") {
        const { filename, contentType, operation, key, uploadId, partNumber, parts, size } = req.body;
        if (
            (operation === "createMultipartUpload" && (!filename || !contentType)) ||
            (operation === "prepareUploadPart" && (!key || !uploadId || !partNumber)) ||
            (operation === "completeMultipartUpload" && (!key || !uploadId || !parts))
        ) {
            res.status(status.BAD_REQUEST).json({ message: "Missing parameters" });
            return;
        }


        let result;
        if (operation === "createMultipartUpload" && filename && contentType) {
            const Key = uploadId || uuidv4();
            result = await s3.send(new CreateMultipartUploadCommand({
                Bucket: env.AWS_S3_BUCKET,
                Key: Key,
                ContentType: contentType,
                Metadata: {
                    userId,
                    file: JSON.stringify({
                        id: Key,
                        size: size as number,
                        metadata: {
                            name: filename,
                            size,
                            filename,
                            filetype: contentType,
                        }
                    })
                },
            }));

            res.status(status.OK).json({
                uploadId: result.UploadId,
                key: Key,
            });
        } else if (operation === "prepareUploadPart" && key && uploadId && partNumber) {
            // @ts-ignore
            const signedUrl = await getSignedUrl(s3, new UploadPartCommand({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: key,
                UploadId: uploadId,
                PartNumber: partNumber,
            }));

            res.status(status.OK).json({ url: signedUrl });
        } else if (operation === "completeMultipartUpload" && key && uploadId && parts) {
            result = await s3.send(new CompleteMultipartUploadCommand({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: key,
                UploadId: uploadId,
                MultipartUpload: {
                    Parts: parts,
                },
            }));

            res.status(status.OK).json({
                location: result.Location,
            });

            await prisma?.upload.create({
                data: {
                    size: size as number,
                    offset: 0,
                    creationDate: new Date(),
                    transcoded: false,
                    id: key,
                }
            });

            await prisma.videoMetadata.create({
                data: {
                    name: filename as string,
                    type: contentType,
                    fileType: contentType,
                    fileName: filename,
                    relativePath: key,
                    uploadId: key,
                }
            });

            await queue.add("post-upload", { uploadId: key, fileName: filename });
        } else {
            res.status(status.BAD_REQUEST).json({ message: "Invalid operation or missing parameters" });
        }

    } else {
        res.status(status.METHOD_NOT_ALLOWED).json({ message: "Method not allowed" });
    }
};


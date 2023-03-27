import { moveObject } from "@/utils/s3";
import { GetObjectCommandInput, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { log } from "next-axiom";
export default async function moveUpload({ uploadId, fileName }: { uploadId: string, fileName: string }) {
    log.debug(`Moving upload ${uploadId} to originals/${uploadId}/${fileName}...`);

    const getObjectInput: GetObjectCommandInput = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: uploadId,
    };

    const putObjectInput: PutObjectCommandInput = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `originals/${uploadId}/${fileName}`,
    };

    await moveObject(getObjectInput, putObjectInput);

    log.debug(`Moved upload ${uploadId} to originals/${uploadId}/${fileName}...`);
}

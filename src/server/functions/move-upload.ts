import { deleteObject, getObject, putObject } from "@/utils/s3";
import { log } from "next-axiom";
export default async function moveUpload({ uploadId, fileName }: { uploadId: string, fileName: string }) {
    log.debug(`Moving upload ${uploadId} to originals/${uploadId}/${fileName}...`)
    const upload = await getObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: uploadId,
    })

    await putObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `originals/${uploadId}/${fileName}`,
        Body: upload!.Body,
    });


    await deleteObject(`https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadId}`);

    log.debug(`Moved upload ${uploadId} to originals/${uploadId}/${fileName}...`)
}

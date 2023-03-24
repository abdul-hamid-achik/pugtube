import { Sha256 } from "@aws-crypto/sha256-browser";
import { DeleteObjectCommand, GetObjectCommand, GetObjectCommandInput, PutObjectCommand, PutObjectCommandInput, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { HttpRequest } from "@aws-sdk/protocol-http";
import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { parseUrl } from '@aws-sdk/url-parser';
import { formatUrl } from '@aws-sdk/util-format-url';
import { log } from 'next-axiom';

export const s3 = new S3Client({
    region: process.env.AWS_REGION as string,
} as S3ClientConfig);


export async function getPresignedPutUrl(key: string, contentType: string, expiresIn = 3600) {
    const presigner = new S3RequestPresigner({
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
        },
        region: process.env.AWS_REGION as string,
        sha256: Sha256,
    });

    const request = new HttpRequest({
        method: "PUT",
        protocol: "https",
        hostname: `${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`,
        path: `/${key}`,
        headers: {
            "Content-Type": contentType,
        },
    });

    const signedUrl = await presigner.presign(request, { expiresIn });
    return formatUrl(signedUrl);
}


export async function putObject(input: PutObjectCommandInput) {
    try {
        const result = await s3.send(new PutObjectCommand(input));
        log.info(`Uploaded to S3: ${input.Key}`);

        return result
    } catch (error) {
        log.error(`Error uploading to S3: ${input.Key}`, error as { [key: string]: any; });
    }
};

export async function getSignedUrl(s3ObjectUrl: string) {
    const { bucket, region, key } = parseS3ObjectUrl(s3ObjectUrl);

    const presigner = new S3RequestPresigner({
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
        },
        region: region as string,
        sha256: Sha256,
    });

    const request = new HttpRequest(parseUrl(s3ObjectUrl))

    const signedUrl = await presigner.presign(
        request,
        {

            expiresIn: 3600, // 1 hour
        }
    );

    return formatUrl(signedUrl)
}

function parseS3ObjectUrl(s3ObjectUrl: string) {
    const match = s3ObjectUrl.match(
        /^https:\/\/(.+)\.s3\.(.+)\.amazonaws.com\/(.+)$/
    );
    if (!match || match.length !== 4) {
        throw new Error(`Invalid S3 object URL: ${s3ObjectUrl}`);
    }
    return {
        bucket: match[1],
        region: match[2],
        key: match[3],
    };
}

export async function getObject(input: GetObjectCommandInput) {
    try {
        const result = await s3.send(new GetObjectCommand(input));

        log.info(`Downloaded from S3: ${input.Key}`);

        return result
    } catch (error) {
        log.error(`Error downloading from S3: ${input.Key}`, error as { [key: string]: any; });
    }
}

export async function deleteObject(objectUrl: string) {
    const { bucket, key } = parseS3ObjectUrl(objectUrl);

    try {
        const result = await s3.send(new DeleteObjectCommand({
            Bucket: bucket,
            Key: key
        }));

        log.info(`Deleted from S3: ${objectUrl}`);

        return result
    } catch (error) {
        log.error(`Error deleting from S3: ${objectUrl}`, error as { [key: string]: any; });
    }
}

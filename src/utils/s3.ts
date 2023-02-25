import { Sha256 } from "@aws-crypto/sha256-browser";
import { DeleteObjectCommand, GetObjectCommand, GetObjectCommandInput, PutObjectCommand, PutObjectCommandInput, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { HttpRequest } from "@aws-sdk/protocol-http";
import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { parseUrl } from '@aws-sdk/url-parser';
import { formatUrl } from '@aws-sdk/util-format-url';
import axios from 'axios';
import fs from "fs";
import { log as logger } from 'next-axiom';
import os from "os";

const log = logger.with({ function: 'S3' });
const s3 = new S3Client({
    region: process.env.AWS_REGION as string,
} as S3ClientConfig);

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

    // method 1
    const { bucket, region, key } = parseS3ObjectUrl(s3ObjectUrl);

    const presigner = new S3RequestPresigner({
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
        },
        region: region as string,
        sha256: Sha256,
    });
    //https://pugtube.s3.us-west-1.amazonaws.com/transcoded/ace9dbbd-78c2-4dd3-9776-84a9cc227d38/segment-0.ts?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEHkaCXVzLWVhc3QtMSJHMEUCIBxYbGXEwxRD8R1irb%2FET4i%2BFNwZhcaUuPbCV7yxEfG1AiEAzeAtgY2MuGgIoJKXC9AF4tL%2BKd65ZGbZtqCLblDim2oq6AIIIhADGgw3MTAwNzg3MTQ4MTciDPc19Hd80dEvIiwApirFAn7SDukz%2BB7Ke1dDE%2B1ZiaKSjLFR0Lj3%2FWCGyBVwGznwGnFEeQcqhH%2FbK0PCOavlCFh63kMO%2BRJuZ%2BelCueoKGkkT8VBmDhTnoQ10vqMbp1N2uI3LvyyeBwl3iGf27%2F32yYks8OvkmdhF4qE%2F%2FpwQG%2FwH0XkRf6tQJJs%2FYEuUGbjJXwhkPp84bmpMz144M0iq9DPpor5O2Uk2ub7Xkp8zhQ3cwdCFmFwFCe9WfIdN0vAvBymD4WJuS5iRAbTXIHg9xOuywCdgy6XgN8aaZWrlNCG6IhtCR5crbJNEzOBgBVF%2BSR8bfzXjXSmBTI1USMQXFA2N6D0HxiyMQixxkH5DbFQB2Vso8u4JEy4HteCJpa6mDfEDvflFpzOvgcUNP0SPf1INCMYF%2Fu1ZVXEE4oZws7Mu0gphNi9SdvYvkAlb8HlGrwuv0ow%2B7DlnwY6swKfm%2BHWdRtAgYDvys%2BAt9uzFoOUldlIUF0w5K5OR%2BxncGtwnY5KkS2LNE5zls6VzqFSXg5ueicl0TWXlogB7MatSCS3VoQLweqaMBVmtYmdU%2Bh06ZlXd0dUHZtViXYFhX6Tgi4B%2BeFv%2BVdUjx80MIIufLp%2FrwJg%2Bqt0Qo5ZraHmCqsxztCjVP8k4gyx3ynbp9Kkv16CiAarxPJAWQiGhxjya228ThImWFbR%2FkLhpNUcMGhVCKKt%2FO7ugYHtZadeF8K0kaYXaFH4N8d9ayDzLm6WUCAdEQYdqUoq9FfWoAMugBDnv%2BlFtLN5l%2FcU9cHsO9aV566gqliZJ2fQLUoERTrrfzSm6Oca5FBefhwkwqTVl6%2FOHGLLP8lmTQkkVTrZPQwZKvXCbtscq3AdzGUH7GCEobK%2B&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20230225T065358Z&X-Amz-SignedHeaders=host&X-Amz-Expires=900&X-Amz-Credential=ASIA2KU75KPA4JWCIL6C%2F20230225%2Fus-west-1%2Fs3%2Faws4_request&X-Amz-Signature=afff917dac723f1f5133850b3922996a5d2ca6a35323f415b5a38d6a77a0d985
    // Create a GET request from S3 url.
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

export async function downloadObject(objectUrl: string): Promise<string> {
    const objectKey = objectUrl.split('/').slice(3).join('/');
    const filePath = `${os.tmpdir()}/output/${objectKey}`;

    if (fs.existsSync(filePath)) {
        return filePath;
    }

    if (!fs.existsSync(`${os.tmpdir()}/output`)) {
        fs.mkdirSync(`${os.tmpdir()}/output`);
    }

    const signedUrl = await getSignedUrl(objectUrl);

    const response = await axios.get(signedUrl, { responseType: 'arraybuffer' });
    fs.writeFileSync(filePath, response.data);

    return filePath;
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

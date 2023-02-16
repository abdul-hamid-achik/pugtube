// @ts-check
import { z } from "zod";

export const server = z.object({
  AWS_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_S3_BUCKET: z.string(),
});

export const client = z.object({});

export const processEnv = {
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
};

const formatErrors = (
  /** @type {import('zod').ZodFormattedError<Map<string,string>,string>} */
  errors
) =>
  Object.entries(errors)
    .map(([name, value]) => {
      if (value && "_errors" in value) {
        return `${name}: ${value._errors.join(", ")}\n`;
      }
    })
    .filter(Boolean);

const isServer = typeof window === "undefined";

const merged = server.merge(client);
const parsed = isServer
  ? merged.safeParse(processEnv) // <-- on server, validate all
  : client.safeParse(processEnv); // <-- on client, validate only client

if (parsed.success === false) {
  console.error(
    "❌ Invalid environment variables:\n",
    ...formatErrors(parsed.error.format())
  );
  throw new Error("Invalid environment variables");
}

// proxy allows us to remap the getters
export const env = new Proxy(parsed.data, {
  get(target, prop) {
    if (typeof prop !== "string") return undefined;
    // on the client we only allow NEXT_PUBLIC_ variables
    if (!isServer && !prop.startsWith("NEXT_PUBLIC_")) {
      throw new Error(
        "❌ Attempted to access serverside environment variable on the client"
      );
    }
    // @ts-ignore
    return target[prop]; // <-- otherwise, return the value
  },
});

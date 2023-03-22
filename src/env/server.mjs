// @ts-check
/**
 * This file is included in `/next.config.mjs` which ensures the app
 * isn't built with invalid env vars.
 * It has to be a `.mjs`-file to be imported there.
 */
import { serverEnv, serverSchema } from "./schema.mjs";

const _serverEnv = serverSchema.safeParse(serverEnv);

export const formatErrors = (
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

if (!_serverEnv.success) {
  console.error(
    "❌ Invalid environment variables:\n",
    ...formatErrors(_serverEnv.error.format())
  );
  throw new Error("Invalid environment variables");
}

export const env = _serverEnv.data;

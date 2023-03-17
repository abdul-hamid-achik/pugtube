// @ts-check

!process.env.SKIP_ENV_VALIDATION && (await import("./src/env/server.mjs"));

import { withSentryConfig } from "@sentry/nextjs";
import { withAxiom } from "next-axiom";
import path from "path";

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  i18n: {
    locales: ["en", "es"],
    defaultLocale: "en",
  },
  webpack(config, { isServer }) {
    config.experiments = { ...config.experiments, topLevelAwait: true };
    if (isServer) {
      config.resolve.alias["@ffmpeg/ffmpeg/src/createFFmpeg"] = path.resolve(
        path.dirname(import.meta.url),
        "./src/utils/ffmpeg.ts"
      );
    }
    return config;
  },
  sentry: {
    hideSourceMaps: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "loremflickr.com",
      },
      {
        protocol: "https",
        hostname: "cloudflare-ipfs.com",
      },
      {
        protocol: "https",
        hostname: "www.gravatar.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
      {
        protocol: "https",
        hostname: "pugtube.s3.us-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "pugtube-dev.s3.us-west-1.amazonaws.com",
      },
    ],
  },
};

export default withSentryConfig(withAxiom(config), {
  silent: true,
});

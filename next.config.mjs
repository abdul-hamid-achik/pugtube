// @ts-check

!process.env.SKIP_ENV_VALIDATION && (await import("./src/env/server.mjs"));
import { withSentryConfig } from "@sentry/nextjs";
import { withAxiom } from "next-axiom";

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  sentry: {
    hideSourceMaps: true,
    autoInstrumentServerFunctions: true,
  },
  i18n: {
    locales: ["en", "es"],
    defaultLocale: "en",
  },
  experimental: {
    appDir: true,
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
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore

  silent: true, // Suppresses all logs
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
};
export default withSentryConfig(withAxiom(config), sentryWebpackPluginOptions);

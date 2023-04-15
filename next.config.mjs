// @ts-check

!process.env.SKIP_ENV_VALIDATION && (await import("./src/env.mjs"));
import { withAxiom } from "next-axiom";

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  i18n: {
    locales: ["en", "es"],
    defaultLocale: "en",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "loremflickr.com",
      },
      {
        protocol: "https",
        hostname: "tailwindui.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
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

export default withAxiom(config);

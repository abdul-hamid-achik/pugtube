const importantPaths = [
  "/",
  "/watch/*",
  "/results/*",
  "/channel/*",
  "/api/playlist/*",
];

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "pugtube.dev",
  generateRobotsTxt: true,
  exclude: [
    "/404",
    "/500",
    "/api/*",
    "/user-profile/*",
    "/sign-in/*",
    "/sign-up/*",
    "/upload/*",
  ],
  robotsTxtOptions: {
    policies: importantPaths.map((path) => ({
      userAgent: "*",
      allow: path,
    })),
  },
  additionalPaths: async (config) =>
    await Promise.all(
      importantPaths.map((path) => config.transform(config, path))
    ),
};

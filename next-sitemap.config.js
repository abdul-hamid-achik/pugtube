const importantPaths = [
  "/",
  "/watch/*",
  "/results/*",
  "/channel/*",
  "/api/playlist/*",
];

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://pugtube.dev",
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
  additionalPaths: async (config) => {
    global.fetch = await import("node-fetch").then((e) => e.default);
    const { connect } = await import("@planetscale/database");
    const { clerkClient } = await import("@clerk/clerk-sdk-node");
    const connection = connect({
      url: process.env["DATABASE_URL"],
    });

    const videoQueryRows = await connection.execute("SELECT id FROM videos;");

    const videoPaths = videoQueryRows.rows.map((row) => `/watch/${row.id}`);

    const users = await clerkClient.users.getUserList();

    const userPaths = users.map((user) => `/channel/${user.username}`);

    const extras = [...importantPaths, ...videoPaths, ...userPaths];

    // TODO: generate search results here too
    return await Promise.all(
      extras.map((path) => config.transform(config, path))
    );
  },
};

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
};

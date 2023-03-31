import dotenv from "dotenv-vault-core";
import { defineConfig } from "cypress";

dotenv.config();

export default defineConfig({
  projectId: "jcfv2t",
  defaultCommandTimeout: 60000,
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:3000",
    setupNodeEvents(_on, _config) {
      // implement node event listeners here
    },
    env: {
      NODE_ENV: "production",
    },
  },

  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
    specPattern: "src/**/*.cy.{js,jsx,ts,tsx}",
    env: {
      NODE_ENV: "development",
    },
  },
});

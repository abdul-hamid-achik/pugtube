import { defineConfig } from "cypress";
import dotenv from "dotenv";
import fs from "fs";

console.log("Loading .env file (if it exists)...");
if (fs.existsSync(".env")) {
  console.log("loading .env file")
  dotenv.config();
} else if (fs.existsSync(".env.local")) {
  console.log("loading .env.local file")
  dotenv.config({ path: ".env.local" });
} else if (fs.existsSync(".env.development.local")) {
  console.log("loading .env.development.local file")
  dotenv.config({ path: ".env.development.local" });
} else if (fs.existsSync(".env.production.local")) {
  console.log("loading .env.production.local file")
  dotenv.config({ path: ".env.production.local" });
} else if (fs.existsSync(".env.preview.local")) {
  console.log("loading .env.preview.local file")
  dotenv.config({ path: ".env.preview.local" });
}


export default defineConfig({
  projectId: "jcfv2t",
  defaultCommandTimeout: 60000,
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(_on, _config) {
      // implement node event listeners here
    },
    env: {
      NODE_ENV: "production",
    }
  },

  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    env: {
      NODE_ENV: "test",
    }
  },
});

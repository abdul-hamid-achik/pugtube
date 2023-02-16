import { defineConfig } from "cypress";

export default defineConfig({
  projectId: "jcfv2t",
  defaultCommandTimeout: 60000,
  e2e: {
    setupNodeEvents(_on, _config) {
      // implement node event listeners here
    },
  },

  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },

  env: {
    NODE_ENV: "test",
  }
});

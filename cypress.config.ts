import { defineConfig } from "cypress";

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

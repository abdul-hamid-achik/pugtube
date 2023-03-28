// jest.config.js
const nextJest = require("next/jest");
const tsconfig = require("./tsconfig.json");
const moduleNameMapper = require("tsconfig-paths-jest")(tsconfig);
const createJestConfig = nextJest({
  dir: "./",
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  testEnvironment: "node",
  testMatch: ["**/*.spec.[jt]s?(x)"],
  testTimeout: 120_000,
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "@swc/jest",
  },
  transformIgnorePatterns: ["node_modules/(?!@aws-sdk/.*)"],
  moduleNameMapper,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);

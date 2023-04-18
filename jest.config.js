const nextJest = require('next/jest')
const tsconfig = require('./tsconfig.json')
const moduleNameMapper = require('tsconfig-paths-jest')(tsconfig)
const createJestConfig = nextJest({
  dir: './',
})

/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['**/*.spec.[jt]s?(x)'],
  transformIgnorePatterns: ['node_modules/(?!@aws-sdk/.*)'],
  moduleNameMapper,
}

module.exports = createJestConfig(customJestConfig)

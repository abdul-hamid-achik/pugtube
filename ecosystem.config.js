module.exports = {
  apps: [
    {
      name: "pugtube-worker",
      script: "./src/worker.ts",
      interpreter: "tsx",
      node_args:
        "--experimental-wasm-threads --experimental-wasm-modules --trace-warnings",
      exec_mode: "fork",
      instances: 2,
      max_memory_restart: "4G",
      watch: false,
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};

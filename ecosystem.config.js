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
      max_memory_restart: "1G",
      restart_delay: 2000,
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
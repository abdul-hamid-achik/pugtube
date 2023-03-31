// export { default as deleteVideoArtifacts } from "./delete-video-artifacts";
// export { default as generateThumbnail } from "./generate-thumbnail";
// export { default as moveUpload } from "./move-upload";
// export { default as transcodeVideo } from "./transcode-video";
// export { default as generatePreview } from "./generate-preview";
// export { default as analyzeVideo } from "./analyze-video";
// export { default as extractThumbnails } from "./extract-thumbnails";

import fs from "fs";
import path from "path";
import { workflows } from "@/server/workflows";
import { JobNode } from "bullmq";

const jobsPath = path.resolve(__dirname);
const jobFiles = fs
  .readdirSync(jobsPath)
  .filter(
    (file) =>
      file.endsWith(".ts") && !file.endsWith(".spec.ts") && file !== "index.ts"
  );

export const jobList: { [key: string]: (data: any) => Promise<void> } = {};
export type JobFunction = (...args: any) => Promise<void | JobNode>;
export type JobRegistry = {
  [K in keyof typeof jobList]: JobFunction;
};
export const registry: JobRegistry = { ...workflows } as JobRegistry;

const makeRegistryId = (name: string) =>
  name.replace(/-([a-z])/g, (g) => g[1]!.toUpperCase());

for (const file of jobFiles) {
  const moduleName = makeRegistryId(file.replace(/\.ts$/, ""));
  registry[moduleName] = require(path.join(jobsPath, file)).default;
}

export function getJob(name: string): JobFunction | void {
  const registryId = makeRegistryId(name);
  if (isJobRegistered(registryId)) {
    return registry[registryId]!;
  }
}

export function isJobRegistered(name: string): boolean {
  return !!registry[name];
}

export default registry;

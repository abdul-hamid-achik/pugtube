import fs from "fs";
import path from "path";
import { workflows } from "@/server/workflows";
import { JobNode } from "bullmq";

export type JobFunction = (...args: any) => Promise<void | JobNode>;

const jobsPath = path.resolve(__dirname);
const jobFiles = fs
  .readdirSync(jobsPath)
  .filter(
    (file) =>
      file.endsWith(".ts") && !file.endsWith(".spec.ts") && file !== "index.ts"
  );

type JobName = (typeof jobFiles)[number];

type RegistryType = {
  [K in JobName]: JobFunction;
};

const registry: Partial<RegistryType> & { [key: string]: JobFunction } = {
  ...workflows,
};

Promise.all(
  jobFiles.map(async (file) => {
    const moduleName = makeRegistryId(file.replace(/\.ts$/, ""));
    const importedModule = await import(path.join(jobsPath, file));
    registry[moduleName] = importedModule.default;
  })
).catch((error) => {
  console.error("Failed to load job modules:", error);
});

function makeRegistryId(name: string): string {
  return name.replace(/-([a-z])/g, (g) => g[1]!.toUpperCase());
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

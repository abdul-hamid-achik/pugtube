import { JobNode } from "bullmq";

export type JobFunction = (...args: any) => JobNode;

export async function getJob(name: string) {
  return (await import(`./${name}`).then(
    (module) => module.default
  )) as JobFunction;
}

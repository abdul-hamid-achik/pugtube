import { JobNode } from "bullmq";

export type JobFunction = (...args: any) => JobNode;
export async function getJob(name: string) {
  if (["postUpload", "backfill"].includes(name)) {
    return (await import(`../workflows`).then(
      // @ts-ignore
      (module) => module.workflows[name]
    )) as JobFunction;
  }
  const formattedName = name.replace(
    /[A-Z]+(?![a-z])|[A-Z]/g,
    ($, ofs) => (ofs ? "-" : "") + $.toLowerCase()
  );

  return (await import(`./${formattedName}`).then(
    (module) => module.default
  )) as JobFunction;
}

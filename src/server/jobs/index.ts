import { JobNode } from "bullmq";

export type JobFunction = (...args: any) => JobNode;
export async function getJob(name: string) {
  const formattedName = name.replace(
    /[A-Z]+(?![a-z])|[A-Z]/g,
    ($, ofs) => (ofs ? "-" : "") + $.toLowerCase()
  );
  return (await import(`./${formattedName}`).then(
    (module) => module.default
  )) as JobFunction;
}

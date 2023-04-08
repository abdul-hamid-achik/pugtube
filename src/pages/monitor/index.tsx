import { api } from "@/utils/api";
import Timestamp from "@/components/timestamp";
import { JobType } from "bullmq";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

const states: JobType[] = [
  "completed",
  "failed",
  "active",
  "delayed",
  "waiting",
  "waiting-children",
  "paused",
  "repeat",
  "wait",
];
function Monitor() {
  const [state, setState] = useState<JobType | null>();
  const { data, refetch } = api.background.jobsByState.useQuery(
    state ? [state] : states
  );

  const { mutateAsync: remove } =
    api.background.removeJobFromQueue.useMutation();

  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-white">Monitor</h1>
      <ul className="flex w-full flex-row text-white">
        {states.map((state) => (
          <li key={state} className="p-2">
            <button
              className={`px-4 py-2 text-white ${
                state === state ? "bg-blue-500" : "bg-gray-500"
              }`}
              onClick={() => {
                if (state === state) {
                  setState(null);
                } else {
                  setState(state);
                }
              }}
            >
              {state}
            </button>
          </li>
        ))}
      </ul>
      <ul className="bg-gray-600 p-4 text-white">
        {data?.map((job) => (
          <li
            key={job.id}
            className="border-b-2 border-dashed border-gray-50 px-0 py-4"
          >
            <div className="flex w-full justify-between">
              <p>ID: {job.id}</p>
              <button
                onClick={() => {
                  remove(job.id!).then(() => refetch());
                }}
                className="bg-red-500 px-4 py-2 text-white"
                type="button"
              >
                <XMarkIcon className="h-4 w-4" />
                <span className="sr-only">Remove job from queue</span>
              </button>
            </div>
            <h2>Name: {job.name}</h2>
            <p>Data: {JSON.stringify(job.data, null, 2)}</p>
            <p>Progress: {JSON.stringify(job.progress, null, 2)}</p>
            <p>Failure Reason: {job.failedReason}</p>
            <p>Return Value: {job.returnvalue}</p>
            <p>Stack Trace: {JSON.stringify(job.stacktrace, null, 2)}</p>
            <Timestamp timestamp={job.timestamp / 1000} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Monitor;

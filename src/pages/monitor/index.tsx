import { api } from "@/utils/api";
import Timestamp from "@/components/timestamp";

function Monitor() {
  const { data, refetch } = api.background.jobsByState.useQuery([
    "completed",
    "failed",
    "active",
    "delayed",
    "waiting",
    "waiting-children",
    "paused",
    "repeat",
    "wait",
  ]);

  const { mutateAsync: remove } =
    api.background.removeJobFromQueue.useMutation();
  return (
    <>
      <h1>Monitor</h1>
      {data?.map((job) => (
        <div key={job.id}>
          <p>{job.id}</p>
          <h2>{job.name}</h2>
          <p>{JSON.stringify(job.data, null, 2)}</p>
          <p>{JSON.stringify(job.progress, null, 2)}</p>
          <p>{job.failedReason}</p>
          <p>{job.returnvalue}</p>
          <p>{job.stacktrace}</p>
          <Timestamp timestamp={job.timestamp} />
          <div>
            <button
              onClick={() => {
                remove(job.id!).then(() => refetch());
              }}
              type="button"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </>
  );
}

export default Monitor;

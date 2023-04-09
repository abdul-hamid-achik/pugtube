import { api } from "@/utils/api";
import Timestamp from "@/components/timestamp";
import { JobType } from "bullmq";
import {
  ArrowPathIcon,
  CheckIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  FunnelIcon,
  HandRaisedIcon,
  MagnifyingGlassIcon,
  PauseIcon,
  PlayIcon,
  QuestionMarkCircleIcon,
  ViewColumnsIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Spinner from "@/components/spinner";
import {
  Card,
  DateRangePicker,
  DonutChart,
  Grid,
  LineChart,
  Metric,
  Tab,
  TabList,
  Text,
  Title,
} from "@tremor/react";
import { NextPageWithLayout } from "@/pages/_app";
import { Disclosure } from "@headlessui/react";
import Link from "next/link";
import { type BullMqJob } from "@/server/queue";

type State = JobType | "all";
const states: State[] = [
  "all",
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

const stateIcons = {
  all: <ViewColumnsIcon className="h-4 w-4" />,
  completed: <CheckIcon className="h-4 w-4" />,
  failed: <XMarkIcon className="h-4 w-4" />,
  active: <ClockIcon className="h-4 w-4" />,
  delayed: <ClockIcon className="h-4 w-4" />,
  waiting: <PlayIcon className="h-4 w-4" />,
  "waiting-children": <PlayIcon className="h-4 w-4" />,
  paused: <PauseIcon className="h-4 w-4" />,
  repeat: <ArrowPathIcon className="h-4 w-4" />,
  wait: <PlayIcon className="h-4 w-4" />,
  unknown: <QuestionMarkCircleIcon className="h-4 w-4" />,
};

interface Props {
  jobs: BullMqJob[];
}

export async function getServerSideProps() {
  const queue = await import("@/server/queue").then(
    (exports) => exports.default
  );
  const jobs = await queue.getJobs().then((jobs) =>
    Promise.all(
      jobs
        .map(async (job) => ({
          ...job.toJSON(),
          state: (await job.getState()) as State,
        }))
        .map(
          async (job: any) =>
            ({
              ...job,
              repeatJobKey: job.repeatJobKey ?? null,
            } as BullMqJob & { repeatJobKey: string | null })
        )
    )
  );

  return {
    props: {
      jobs,
    },
  };
}
const Monitor: NextPageWithLayout<Props> = (props) => {
  const [state, setState] = useState<State>("all");
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);

  const router = useRouter();
  const {
    data = [],
    refetch,
    isLoading,
  } = api.background.jobs.useQuery(
    {
      states:
        state === "all"
          ? (states.filter((s) => s !== "all") as JobType[])
          : [state],
      start: start?.getTime() ?? undefined,
      end: end?.getTime() ?? undefined,
    },
    {
      refetchInterval: 2000,
    }
  );

  const { mutateAsync: remove } = api.background.remove.useMutation();
  const { mutateAsync: pause } = api.background.pause.useMutation();
  const { mutateAsync: resume } = api.background.resume.useMutation();

  useEffect(() => {
    refetch({}).catch((e) => console.error(e));
  }, [refetch, state]);

  console.log(
    data
      .map((job) => ({
        id: job.id,
        state: job.state,
        duration: job.finishedOn! - job.processedOn!,
        timestamp: new Date(job.timestamp * 1000).toLocaleString(),
      }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  );
  return (
    <main className="h-screen w-screen overflow-hidden px-4 py-8">
      <Title className="text-white">Monitor</Title>
      <Text className="text-white">
        watch all background activity happen here. to go back{" "}
        <Link href="/">click here</Link>
      </Text>
      <TabList
        defaultValue="all"
        onValueChange={(value: string) => setState(value as JobType)}
        className="mt-6"
      >
        {states.map((jobType) => (
          <Tab key={jobType} value={jobType} text={jobType.toUpperCase()} />
        ))}
      </TabList>
      <Grid numColsMd={2} numColsLg={3} className="mt-6 gap-6">
        <Card>
          <div className="flex h-28 flex-row">
            <div className="flex flex-col">
              <Text>Jobs</Text>
              <Metric>{data!.length}</Metric>
            </div>
            <DonutChart
              valueFormatter={(number: number) => `${number}`}
              className="h-24"
              category="count"
              index="state"
              variant="pie"
              colors={[
                "lime",
                "indigo",
                "blue",
                "violet",
                "amber",
                "slate",
                "zinc",
                "neutral",
                "stone",
                "red",
                "orange",
              ]}
              data={Object.entries(
                data.reduce((counts, job) => {
                  const { state } = job;
                  if (!(state in counts)) {
                    counts[state as State] = 0;
                  }
                  counts[state as State]++;
                  return counts;
                }, {} as Record<State | "unknown", number>)
              ).map(([state, count]) => ({ state, count }))}
            />
          </div>
        </Card>
        <Card>
          <div className="h-28">
            <LineChart
              className="mt-4 h-28"
              data={data
                .map((job) => ({
                  id: job.id,
                  state: job.state,
                  duration: job.finishedOn! - job.processedOn!,
                  timestamp: new Date(job.timestamp * 1000).toLocaleString(),
                }))
                .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
                .reduce((acc: any[], cur, idx, arr) => {
                  const startAt = start || arr[0]!.timestamp;
                  const endAt = end || arr[arr.length - 1]!.timestamp;

                  const totalMilliseconds =
                    new Date(endAt).getTime() - new Date(startAt).getTime();
                  const step = Math.ceil(totalMilliseconds / 10);

                  if (
                    cur.timestamp >= startAt &&
                    cur.timestamp <= endAt &&
                    (acc.length === 0 ||
                      new Date(cur.timestamp).getTime() -
                        new Date(acc[acc.length - 1].timestamp).getTime() >=
                        step)
                  ) {
                    acc.push(cur);
                  }

                  return acc;
                }, [])}
              index="timestamp"
              categories={["state"]}
              colors={["lime"]}
              yAxisWidth={40}
            />
          </div>
        </Card>
        <Card>
          <div className="h-14">
            <Text>Actions</Text>
            {data.length > 0 && (
              <button
                className="rounded-md bg-red-500 px-4 py-2 text-white"
                onClick={() =>
                  Promise.all(data.map(({ id }) => remove(id!))).then(() =>
                    refetch({})
                  )
                }
              >
                <XMarkIcon className="h-4 w-4" />
                <span className="sr-only">Remove All Jobs</span>
              </button>
            )}

            <button
              className="rounded-md bg-blue-400 px-4 py-2 text-white"
              onClick={() => {
                pause().then(() => refetch());
              }}
            >
              <HandRaisedIcon className="h-4 w-4" />
              <span className="sr-only">Pause All Jobs</span>
            </button>

            <button
              className="rounded-md bg-green-400 px-4 py-2 text-white"
              onClick={() => {
                resume().then(() => refetch());
              }}
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span className="sr-only">Resume All Jobs</span>
            </button>

            {(start || end) && (
              <button
                className="rounded-md bg-yellow-400 px-4 py-2 text-white"
                onClick={() => {
                  setStart(null);
                  setEnd(null);
                }}
              >
                <FunnelIcon className="h-4 w-4" />
                <span className="sr-only">Clear Filters</span>
              </button>
            )}
          </div>
          <div className="h-14">
            <Text>Range</Text>
            <DateRangePicker
              onValueChange={(value) => {
                setStart(value[0]!);
                setEnd(value[1]!);
              }}
            />
          </div>
        </Card>
      </Grid>
      <div className="mt-6">
        <Card
          style={{
            maxHeight: "39rem",
            height: "39rem",
          }}
          className="overflow-y-scroll"
        >
          <ul className="text-black">
            {isLoading ? (
              <li
                style={{
                  height: "34rem",
                }}
                className="flex items-center justify-center"
              >
                <Spinner className="h-4 w-4" />
              </li>
            ) : (
              data?.map((job) => (
                <li
                  key={job!.id}
                  className="border-b-2 border-dashed border-gray-500 p-4"
                >
                  <Disclosure>
                    {({ open }) => (
                      <>
                        <Disclosure.Button className="flex w-full flex-row items-center justify-between text-black">
                          {stateIcons[job!.state]}
                          {" - "}
                          <p className="flex flex-row items-center justify-center">
                            {job.state.toUpperCase()}
                          </p>
                          {" - "}
                          <p>{job.id}</p>
                          {" - "}
                          <p>{job.name}</p>
                          {" - "}
                          <Timestamp timestamp={job.timestamp} />
                          <span className="sr-only">Toggle job details</span>
                          {open ? (
                            <XMarkIcon className="h-4 w-4" />
                          ) : (
                            <EllipsisVerticalIcon className="h-4 w-4" />
                          )}
                        </Disclosure.Button>

                        <Disclosure.Panel className="mt-2 flex flex-row justify-between bg-gray-200 p-4 text-black">
                          <div>
                            <div className="mb-4">
                              <Text>
                                Stacktrace: <br />
                              </Text>
                              <code>
                                {job!.stacktrace.map((line) => (
                                  <p key={line}>{line}</p>
                                ))}
                              </code>
                            </div>
                            <div className="mb-4">
                              <Text>
                                Payload: <br />
                              </Text>
                              <code>{JSON.stringify(job!.data, null, 2)}</code>
                            </div>
                            <div>
                              <Text>
                                Result: <br />
                              </Text>
                              <code>
                                {JSON.stringify(job!.returnvalue, null, 2)}
                              </code>
                            </div>
                          </div>
                          <div className="mb-4 flex items-start justify-start">
                            <button
                              className="bg-green-200 py-2 px-4"
                              onClick={() => {
                                router
                                  .push(`/monitor/jobs/${job.id}`)
                                  .catch(console.error);
                              }}
                            >
                              <MagnifyingGlassIcon className="h-4 w-4" />
                            </button>
                            <button
                              className="justify-self-end bg-red-200 py-2 px-4"
                              onClick={() => {
                                remove(job.id!).then(() => refetch());
                              }}
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </Disclosure.Panel>
                      </>
                    )}
                  </Disclosure>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    </main>
  );
};

Monitor.getLayout = (page) => page;

export default Monitor;

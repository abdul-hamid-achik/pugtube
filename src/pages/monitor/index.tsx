import { api } from "@/utils/api";
import Timestamp from "@/components/timestamp";
import { JobType } from "bullmq";
import {
  ArrowPathIcon,
  CheckIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  PauseIcon,
  PlayIcon,
  QuestionMarkCircleIcon,
  ViewColumnsIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import Spinner from "@/components/spinner";
import { Card, Grid, Metric, Tab, TabList, Text, Title } from "@tremor/react";
import { NextPageWithLayout } from "@/pages/_app";
import { Disclosure } from "@headlessui/react";

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

interface Props {}
const Monitor: NextPageWithLayout<Props> = () => {
  const [state, setState] = useState<State>("all");
  const {
    data = [],
    refetch,
    isLoading,
  } = api.background.jobs.useQuery({
    states:
      state === "all"
        ? (states.filter((s) => s !== "all") as JobType[])
        : [state],
  });

  const { mutateAsync: remove } = api.background.remove.useMutation();

  useEffect(() => {
    refetch({}).then((r) => console.log(r));
  }, [refetch, state]);

  return (
    <main className="h-screen w-screen overflow-hidden px-4 py-8">
      <Title className="text-white">Monitor</Title>
      <Text className="text-white">watch all activity happen here</Text>
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
          <div className="h-28">
            <Text>Jobs</Text>
            <Metric>{data!.length}</Metric>
          </div>
        </Card>
        <Card>
          {/* Placeholder to set height */}
          <div className="h-28" />
        </Card>
        <Card>
          <div className="h-28">
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
                Remove all jobs
              </button>
            )}
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
              <li className="flex h-96 items-center justify-center">
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
                        <Disclosure.Button className="flex w-full flex-row justify-between text-black">
                          <p className="flex flex-row items-center justify-center">
                            [{stateIcons[job!.state]} {job.state}]
                          </p>
                          {" - "}
                          <p>{job.id}</p>
                          {" - "}
                          <p>{job.name}</p>
                          {" - "}
                          <Timestamp timestamp={job.timestamp} />
                          {" - "}
                          <span className="sr-only">Toggle job details</span>
                          {open ? (
                            <XMarkIcon className="h-4 w-4" />
                          ) : (
                            <EllipsisVerticalIcon className="h-4 w-4" />
                          )}
                        </Disclosure.Button>

                        <Disclosure.Panel className="mt-2 bg-gray-200 p-4 text-black">
                          <div className="mb-4">
                            <Text>
                              Stacktrace: <br />
                            </Text>
                            <code>
                              {JSON.stringify(job!.stacktrace, null, 2)}
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

import { NextPageWithLayout } from "@/pages/_app";
import { GetServerSidePropsContext } from "next";
import { api } from "@/utils/api";
import queue from "@/server/queue";
import Spinner from "@/components/spinner";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { type BullMqJob } from "@/types/globals";

interface PageProps {
  job: BullMqJob;
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const jobId = ctx.params?.id;
  const job = await queue.getJob(jobId as string);

  if (!jobId || !job) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      job: JSON.parse(JSON.stringify(job!.toJSON())),
    },
  };
}
const Page: NextPageWithLayout<PageProps> = ({ job }) => {
  const { data, isLoading } = api.background.job.useQuery(job.id as string, {
    enabled: !!job.id,
    initialData: job,
    refetchInterval: 3000,
  });

  return (
    <main className="px-4 py-8 text-white">
      <Link
        className="mb-4 flex w-60 flex-row items-center bg-gray-500 py-2 px-4"
        href="/monitor"
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" /> Go back to monitor
      </Link>
      {isLoading && <Spinner className="h-4 w-4" />}
      <pre className="bg-gray-600 p-4">
        {JSON.stringify(data || {}, null, 2)}
      </pre>
    </main>
  );
};

Page.getLayout = (page) => page;
export default Page;

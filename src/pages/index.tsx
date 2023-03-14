import Layout from '@/components/layout';
import Spinner from '@/components/spinner';
import VideoCard from '@/components/video-card';
import { NextPageWithLayout } from '@/pages/_app';
import { api } from '@/utils/api';
import { GetServerSidePropsContext } from 'next';
import { ReactElement } from 'react';

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return {
    props: {}
  }
}

export const Page: NextPageWithLayout = () => {
  const { data, error, isError, isLoading } = api.video.getAll.useQuery({
    page: 1,
    perPage: 9,
  })


  return (
    <section className="">
      {isError && <div className="bg-red-400 text-white"><div className="p-4">
        <p>{error?.message}</p>
      </div>
      </div>}
      {isLoading && <Spinner />}
      <div className="w-full flex-col items-center justify-center gap-4 overflow-y-auto md:grid md:grid-cols-2 lg:grid-cols-3">
        {!isLoading && !isError && data?.map(({ video, author }) => (<VideoCard key={video.id} video={video} author={author} />))}
      </div>
    </section>
  );
}

Page.getLayout = function getLayout(page: ReactElement) {
  return (
    <Layout>
      {page}
    </Layout>
  )
}

export default Page;

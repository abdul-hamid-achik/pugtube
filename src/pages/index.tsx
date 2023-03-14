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
  const { data, isError, isLoading } = api.video.getAll.useQuery({
    page: 1,
    perPage: 9,
  })


  return (
    <section className="my-8 min-h-screen">
      <div className="flex h-full w-full flex-col gap-4 overflow-y-auto md:grid md:grid-cols-2 lg:grid-cols-3">
        {isLoading && <Spinner />}
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

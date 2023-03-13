import Header from '@/components/header';
import Spinner from '@/components/spinner';
import VideoCard from '@/components/video-card';
import { api } from '@/utils/api';
import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';

export async function getServerSideProps(context: GetServerSidePropsContext) {
  return {
    props: {}
  }
}

export default function Home() {
  const { data, isError, isLoading } = api.video.getAll.useQuery({
    page: 1,
    perPage: 9,
  })


  return (
    <>
      <Head>
        <title>Pugtube</title>
        <meta name="description" content="A free video sharing service" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="h-full bg-gray-900 py-2">
        <div className="sticky top-0 z-10 bg-gray-900 pl-4">
          <Header />
        </div>
        <div className="container relative mx-auto max-w-screen-xl px-4">
          <section className="my-8">
            {/* hero section */}
            <div className="flex flex-col gap-4">
              <h1 className="text-4xl font-bold text-white">Pugtube</h1>
              <p className="text-gray-300">A free video sharing service</p>
            </div>
          </section>
          <section className="my-8 min-h-screen">
            {/* recommended videos section */}
            <div className="flex h-full w-full flex-col gap-4 overflow-y-auto md:grid md:grid-cols-2 lg:grid-cols-3">
              {isLoading && <Spinner />}
              {!isLoading && !isError && data?.map(({ video, author }) => (<VideoCard key={video.id} video={video} author={author} />))}
            </div>
          </section>
          <section className="my-8">
            {/* subscribed channels section */}
          </section>
        </div>
      </div>
    </>
  );
}

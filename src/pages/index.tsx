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
      <div className="overflow-auto bg-gray-900 py-2">
        <header className="bg-gray-900 p-4">
          <Header />
        </header>
        <main className="container mx-auto max-w-screen-xl px-4">
          <section className="my-8">
            {/* hero section */}
          </section>
          <section className="my-8">
            {/* recommended videos section */}
            <div className="flex h-screen w-full flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
              {isLoading && <Spinner />}
              {!isLoading && !isError && data?.map(({ video, author }) => (<VideoCard key={video.id} video={video} author={author} />))}
            </div>
          </section>
          <section className="my-8">
            {/* subscribed channels section */}
          </section>
        </main>
        <footer className="bg-gray-900 py-2">
          {/* footer content */}
        </footer>
      </div>
    </>
  );
}


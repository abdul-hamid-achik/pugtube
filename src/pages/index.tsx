import Header from '@/components/header';
import VideoCard from '@/components/video-card';
import { api } from '@/utils/api';
import Head from 'next/head';

export default function Home() {
  const { data, error, isError, isLoading } = api.video.getAll.useQuery({
    page: 1,
    perPage: 10,
  })


  return (
    <>
      <Head>
        <title>Pugtube</title>
        <meta name="description" content="A free video sharing service" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="bg-gray-100">
        <header className="bg-white p-4">
          <Header />
        </header>
        <main className="container mx-auto px-4">
          <section className="my-8">
            {/* hero section */}
          </section>
          <section className="my-8">
            {/* recommended videos section */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {!isLoading && !isError && data?.map((video) => (<VideoCard key={video.id} video={video} />))}
            </div>
          </section>
          <section className="my-8">
            {/* subscribed channels section */}
          </section>
        </main>
        <footer className="bg-white p-4">
          {/* footer content */}
        </footer>
      </div>
    </>
  );
}

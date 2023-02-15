import { type NextPage } from "next";
import Head from "next/head";
import Header from "../components/header";

const Home: NextPage = () => {

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
};

export default Home;


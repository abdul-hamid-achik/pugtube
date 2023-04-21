import Head from 'next/head'

// import { CallToAction } from '@/components/call-to-action'
// import { Faqs } from '@/components/faqs'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { Hero } from '@/components/hero'
import { Pricing } from '@/components/pricing'
// import { PrimaryFeatures } from '@/components/primary-features'
// import { SecondaryFeatures } from '@/components/secondary-features'
// import { Testimonials } from '@/components/testimonials'

function Home() {
  return (
    <>
      <Head>
        <title>
          Pugtube - Video sharing made simple for creators and small business
        </title>
        <meta
          name="description"
          content="Make your videos available to the world with Pugtube. Charge for your videos, or make them free. Subscriptions are also available."
        />
      </Head>
      <Header />
      <main>
        <Hero />
        {/* <PrimaryFeatures />
        <SecondaryFeatures /> */}
        {/* <CallToAction /> */}
        {/* <Testimonials /> */}
        <Pricing />
        {/* <Faqs /> */}
      </main>
      <Footer />
    </>
  )
}

export default Home

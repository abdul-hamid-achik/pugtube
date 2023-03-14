import Header from '@/components/header';
import Head from 'next/head';

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>
        <Head>
            <title>Pugtube</title>
            <meta name="description" content="A free video sharing service" />
            <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="h-screen max-h-screen overflow-y-auto bg-gray-900">
            <div className="sticky top-0 z-10 bg-gray-900 pl-4">
                <Header />
            </div>
            <div className="container relative mx-auto h-full max-w-screen-xl px-4">
                {children}
            </div>
        </div>
    </>
}

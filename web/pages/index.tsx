import Head from 'next/head'
import Image from 'next/image'
import {Configuration, ContentApi, ListVideos200Response} from '../client'

const apiConfiguration = new Configuration({
    basePath: process.env.NEXT_PUBLIC_API_BASE_PATH,
})

const api = new ContentApi(apiConfiguration)

export async function getServerSideProps() {
    let videos: ListVideos200Response = {results: []}
    try {
        const response = await api.listVideos();
        videos = await response.data
    } catch (e: any) {
        console.error(e.message)
    }

    return {
        props: {
            videos
        }, // will be passed to the page component as props
    }
}

export default function Home({videos: {results: videos = []}}: { videos: ListVideos200Response }) {
    return (<div>
        <Head>
            <title>Pugtube</title>
            <meta name="description"
                  content="Free video sharing service for pugs(and no pugs too!)"/>
            <link rel="icon" href="/favicon.ico"/>
        </Head>

        <main className="grid grid-cols-3 gap-4">
            {videos.map(({id, poster, title}) => (
                <div key={id} className="col-span-1">
                    {poster?.file ? <Image src={poster.file as unknown as string} alt={title}
                                           height={64}
                                           width={64}
                                           className="w-full h-64 object-cover"/> :
                        <div className="bg-gray-500 rounded p-3">
                            <svg className="fill-current text-white h-6 w-6" viewBox="0 0 24 24">
                                <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"></path>
                            </svg>
                        </div>}
                    <p className="py-2">{title}</p>
                </div>
            ))}
        </main>
    </div>)
}


import Head from 'next/head'
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

export default function Home({videos}: { videos: ListVideos200Response }) {
    return (<div>
        <Head>
            <title>Pugtube</title>
            <meta name="description"
                  content="Free video sharing service for pugs(and no pugs too!)"/>
            <link rel="icon" href="/favicon.ico"/>
        </Head>

        <main>
            {videos?.results?.map((video) => (<div key={video.id}>
                <h1>{video.title}</h1>
                <video controls preload='metadata' width='360px' poster={video?.poster?.file as unknown as string}>
                    <source src={video?.original_video?.file as unknown as string} type="video/mp4"/>
                </video>
            </div>))}
        </main>

        <footer>
        </footer>
    </div>)
}
//
// const AuthShowcase: React.FC = () => {
//     const { data: sessionData } = useSession();
//
//     const { data: secretMessage } = trpc.auth.getSecretMessage.useQuery(
//         undefined, // no input
//         { enabled: sessionData?.user !== undefined },
//     );
//
//     return (
//         <div className="flex flex-col items-center justify-center gap-4">
//             <p className="text-center text-2xl text-white">
//                 {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
//                 {secretMessage && <span> - {secretMessage}</span>}
//             </p>
//             <button
//                 className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
//                 onClick={sessionData ? () => signOut() : () => signIn()}
//             >
//                 {sessionData ? "Sign out" : "Sign in"}
//             </button>
//         </div>
//     );
// };

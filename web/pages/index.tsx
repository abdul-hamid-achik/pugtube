import Head from 'next/head'
import {Configuration, UploadApi, Upload} from '../client'

const apiConfiguration = new Configuration({
    basePath: process.env.NEXT_PUBLIC_API_BASE_PATH,
})

const api = new UploadApi(apiConfiguration)

export async function getServerSideProps() {
    let uploads: Upload[] = []
    try {
        const response = await api.listUploads();
        uploads = await response.data
    } catch (e) {
        console.error(e)
    }

    return {
        props: {
            uploads: uploads
        }, // will be passed to the page component as props
    }
}

export default function Home({uploads}: { uploads: Upload[] }) {
    return (<div >
            <Head>
                <title>Pugtube</title>
                <meta name="description"
                      content="Free video sharing service for pugs(and no pugs too!)"/>
                <link rel="icon" href="/favicon.ico"/>
            </Head>

            <main>
                {uploads.map((upload) => (<div key={upload.id}>
                    <h1>{upload.title}</h1>
                    <video controls preload='metadata' width='360px'>
                        <source src={upload.file as unknown as string} type="video/mp4"/>
                    </video>
                </div>))}
            </main>

            <footer>
            </footer>
        </div>)
}

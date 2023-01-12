import '../styles/globals.css'
import {useState} from 'react'
import type {AppProps} from 'next/app'
import {SessionProvider} from "next-auth/react"
import Layout from '../components/layout'


import { Hydrate, QueryClient, QueryClientProvider } from '@tanstack/react-query'

export default function App({ Component, pageProps }: AppProps) {
    const [queryClient] = useState(() => new QueryClient())

    return (
        <QueryClientProvider client={queryClient}>
            <Hydrate state={pageProps.dehydratedState}>
                <SessionProvider session={pageProps.session}>
                    <Layout>
                        <Component {...pageProps} />
                    </Layout>
                </SessionProvider>
            </Hydrate>
        </QueryClientProvider>
    )
}
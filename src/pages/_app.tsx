import 'focus-visible'
import '@/styles/globals.css'
import { api } from '@/utils/api'
import { ClerkProvider } from '@clerk/nextjs'
import { type AppProps } from 'next/app'
import type { NextPage } from 'next'
import type { ReactElement, ReactNode } from 'react'
import { Analytics } from '@vercel/analytics/react'

export { reportWebVitals } from 'next-axiom'

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

const MyApp = ({ Component, pageProps }: AppPropsWithLayout) => {
  const getLayout = Component.getLayout ?? ((page) => page)
  return (
    <ClerkProvider {...pageProps}>
      {getLayout(<Component {...pageProps} />)}
      <Analytics />
    </ClerkProvider>
  )
}

export default api.withTRPC(MyApp)

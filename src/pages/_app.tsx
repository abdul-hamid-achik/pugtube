/* eslint-disable react/prop-types */
/* eslint-disable react/function-component-definition */
import { api } from '@/utils/api';
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/react';
import { type AppProps } from 'next/app';
export { reportWebVitals } from 'next-axiom';

import '@/styles/globals.css';


import type { NextPage } from 'next';
import type { ReactElement, ReactNode } from 'react';

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

const MyApp = ({
  Component,
  pageProps,
}: AppPropsWithLayout) => {
  const getLayout = Component.getLayout ?? ((page) => page)

  return (<>
    <ClerkProvider {...pageProps} >
      {getLayout(<Component {...pageProps} />)}
    </ClerkProvider>
    <Analytics />
  </>
  )
};

export default api.withTRPC(MyApp);


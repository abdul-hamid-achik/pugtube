/* eslint-disable react/prop-types */
/* eslint-disable react/function-component-definition */
import { api } from '@/utils/api';
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/react';
import { type AppProps, type AppType } from 'next/app';
export { reportWebVitals } from 'next-axiom';

import '@/styles/globals.css';

const MyApp: AppType<AppProps> = ({
  Component,
  pageProps,
}) => (<>
  <ClerkProvider {...pageProps} >
    <Component {...pageProps} />
  </ClerkProvider>
  <Analytics />
</>
);

export default api.withTRPC(MyApp);

/* eslint-disable react/prop-types */
/* eslint-disable react/function-component-definition */
import { api } from '@/utils/api';
import { Analytics } from '@vercel/analytics/react';
import { type Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { type AppType } from 'next/app';
export { reportWebVitals } from 'next-axiom';

import '@/styles/globals.css';

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => (<>
  <SessionProvider session={session}>
    <Component {...pageProps} />
  </SessionProvider>
  <Analytics />
</>
);

export default api.withTRPC(MyApp);

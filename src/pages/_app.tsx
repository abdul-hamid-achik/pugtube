import { api } from "@/utils/api";
import { ClerkProvider } from "@clerk/nextjs";
import { type AppProps } from "next/app";
import Layout from "@/components/layout";
import "@/styles/globals.css";
import type { NextPage } from "next";
import type { ReactElement, ReactNode } from "react";

export { reportWebVitals } from "next-axiom";

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const MyApp = ({ Component, pageProps }: AppPropsWithLayout) => {
  const getLayout = Component.getLayout ?? ((page) => <Layout>{page}</Layout>);
  return (
    <ClerkProvider {...pageProps}>
      {getLayout(<Component {...pageProps} />)}
    </ClerkProvider>
  );
};

export default api.withTRPC(MyApp);
